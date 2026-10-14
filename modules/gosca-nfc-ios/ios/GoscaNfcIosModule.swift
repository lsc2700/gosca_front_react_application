import CoreNFC
import ExpoModulesCore
import UIKit

/** 앱이 앞에 있을 때 입실 스티커 주소를 읽는다. 아이폰은 이 세션이 있어야 태그를 앱으로 넘긴다. */
public class GoscaNfcIosModule: Module {
  private let reader = GoscaNfcReader()

  public func definition() -> ModuleDefinition {
    Name("GoscaNfcIos")
    Events("onTag")

    AsyncFunction("ensureEnabled") { (promise: Promise) in
      // 지점 진입만으로 세션을 열면 버튼이 무시된다. 시트는 버튼을 누를 때만 연다.
      promise.resolve(nil)
    }

    AsyncFunction("release") { (promise: Promise) in
      self.reader.stop()
      promise.resolve(nil)
    }

    AsyncFunction("prepareScan") { (promise: Promise) in
      self.reader.start { action, url in
        self.emit(action, url)
      }
      promise.resolve(nil)
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
    let open = {
      guard NFCNDEFReaderSession.readingAvailable else {
        self.onEvent?("scan-unsupported", nil)
        self.presentUnavailable()
        return
      }
      let previous = self.session
      self.session = nil
      previous?.invalidate()
      let next = NFCNDEFReaderSession(delegate: self, queue: nil, invalidateAfterFirstRead: false)
      next.alertMessage = "입실·퇴실 스티커에 아이폰을 대 주세요"
      self.session = next
      next.begin()
    }
    if Thread.isMainThread {
      open()
    } else {
      DispatchQueue.main.async(execute: open)
    }
  }

  private func presentUnavailable() {
    let alert = UIAlertController(
      title: "NFC",
      message: "이 아이폰에서는 스티커 읽기를 시작할 수 없습니다.",
      preferredStyle: .alert
    )
    alert.addAction(UIAlertAction(title: "확인", style: .default))
    let scene = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first
    scene?.windows.first { $0.isKeyWindow }?.rootViewController?.present(alert, animated: true)
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
    guard session === self.session else { return }
    if stopped { return }
    readOk = false
    keepReading = false
    self.session = nil
    _ = error
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
