/** 스티커 NDEF 주소에서 입실 토큰만 꺼낸다. 앱 네이티브와 웹이 같은 규칙을 쓴다. */
export function tokenFromNfcTagUrl(url: string | undefined): string {
  if (!url) return "";
  const matched = url.match(/\/nfc\/([^/?#]+)/);
  if (matched) {
    try {
      return decodeURIComponent(matched[1]);
    } catch {
      return matched[1];
    }
  }
  if (!url.includes("://")) return url.trim();
  return "";
}

export type NfcWebMessage = {
  type?: string;
  action?: string;
  url?: string;
};

/** 웹이 postMessage 로 보낸 NFC 동작. 켜기·끄기·읽기·쓰기를 섞지 않는다. */
export function handleNfcWebMessage(
  message: NfcWebMessage,
  api: {
    ensure: () => void;
    release: () => void;
    scan: () => void;
    write: (url: string) => void;
  },
): boolean {
  if (message.type !== "GOSCA_NFC") return false;
  if (message.action === "write" && message.url) api.write(message.url);
  else if (message.action === "scan") api.scan();
  else if (message.action === "ensure") api.ensure();
  else if (message.action === "release") api.release();
  return true;
}
