import CoreNFC
import ExpoModulesCore

/** 앱이 앞에 있을 때 입실 스티커 주소를 읽는다. 아이폰은 이 세션이 있어야 태그를 앱으로 넘긴다. */
public class GoscaNfcIosModule: Module {
  private let reader = GoscaNfcReader()

  public func definition() -> ModuleDefinition {
    Name("GoscaNfcIos")
    Events("onTag")

    Function("ensureEnabled") {
      self.reader.start { action, url in
        self.emit(action, url)
      }
    }

    Function("release") {
      self.reader.stop()
    }

    Function("prepareScan") {
      self.reader.start { action, url in
        self.emit(action, url)
      }
    }

    Function("prepareWrite") { (url: String) in
      _ = url
      self.sendEvent("onTag", ["action": "write-unsupported"])
    }
  }

  private func emit(_ action: String, _ url: String?) {
    if let url {
      sendEvent("onTag", ["action": action, "url": url])
    } else {
      sendEvent("onTag", ["action": action])
    }
  }
}

/** Core NFC 델리게이트는 NSObject 여야 한다. Expo Module 에 직접 붙이면 빌드가 거절한다. */
private final class GoscaNfcReader: NSObject, NFCNDEFReaderSessionDelegate {
  private var session: NFCNDEFReaderSession?
  private var onEvent: ((String, String?) -> Void)?
  private var stopped = false
  private var readOk = false
  private var keepReading = false
  private let prefixes = [
    "",
    "http://www.",
    "https://www.",
    "http://",
    "https://",
    "tel:",
    "mailto:",
    "ftp://anonymous:anonymous@",
    "ftp://ftp.",
    "ftps://",
    "sftp://",
    "smb://",
    "nfs://",
    "ftp://",
    "dav://",
    "news:",
    "telnet://",
    "imap:",
    "rtsp://",
    "urn:",
    "pop:",
    "sip:",
    "sips:",
    "tftp:",
    "btspp://",
    "btl2cap://",
    "btgoep://",
    "tcpobex://",
    "irdaobex://",
    "file://",
    "urn:epc:id:",
    "urn:epc:tag:",
    "urn:epc:pat:",
    "urn:epc:raw:",
    "urn:epc:",
    "urn:nfc:",
  ]

  func start(_ onEvent: @escaping (String, String?) -> Void) {
    stopped = false
    self.onEvent = onEvent
    beginSession()
  }

  func stop() {
    stopped = true
    DispatchQueue.main.async {
      self.session?.invalidate()
      self.session = nil
    }
  }

  private func beginSession() {
    DispatchQueue.main.async {
      guard NFCNDEFReaderSession.readingAvailable else {
        self.onEvent?("scan-unsupported", nil)
        return
      }
      if self.session != nil { return }
      let next = NFCNDEFReaderSession(delegate: self, queue: nil, invalidateAfterFirstRead: false)
      next.alertMessage = "입실·퇴실 스티커에 아이폰을 대 주세요"
      self.session = next
      next.begin()
    }
  }

  func readerSession(_ session: NFCNDEFReaderSession, didDetectNDEFs messages: [NFCNDEFMessage]) {
    for message in messages {
      if let url = firstUrl(message) {
        deliver(url, session: session)
        return
      }
    }
  }

  func readerSession(_ session: NFCNDEFReaderSession, didDetect tags: [NFCNDEFTag]) {
    guard let tag = tags.first else { return }
    session.connect(to: tag) { error in
      if error != nil {
        self.keepReading = true
        session.invalidate(errorMessage: "스티커를 읽지 못했습니다")
        return
      }
      tag.readNDEF { message, _ in
        DispatchQueue.main.async {
          if let message, let url = self.firstUrl(message) {
            self.deliver(url, session: session)
            return
          }
          self.keepReading = true
          session.invalidate(errorMessage: "입실 스티커가 아닙니다")
        }
      }
    }
  }

  func readerSession(_ session: NFCNDEFReaderSession, didInvalidateWithError error: Error) {
    if stopped { return }
    let again = readOk || keepReading || (error as NSError).code == 201
    readOk = false
    keepReading = false
    self.session = nil
    if !again { return }
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
      self.beginSession()
    }
  }

  private func deliver(_ url: String, session: NFCNDEFReaderSession) {
    DispatchQueue.main.async {
      self.readOk = true
      self.onEvent?("tag", url)
      session.alertMessage = "확인했습니다"
      session.invalidate()
    }
  }

  private func firstUrl(_ message: NFCNDEFMessage) -> String? {
    for record in message.records {
      if let text = payloadText(record), text.contains("/nfc/") {
        return text
      }
    }
    return nil
  }

  private func payloadText(_ record: NFCNDEFPayload) -> String? {
    if record.typeNameFormat == .nfcWellKnown,
       String(data: record.type, encoding: .utf8) == "U",
       !record.payload.isEmpty
    {
      let code = Int(record.payload[0])
      let prefix = code >= 0 && code < prefixes.count ? prefixes[code] : ""
      let rest = String(data: record.payload.dropFirst(), encoding: .utf8) ?? ""
      return prefix + rest
    }
    return String(data: record.payload, encoding: .utf8)
  }
}
