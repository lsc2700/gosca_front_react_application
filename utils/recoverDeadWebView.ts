/** 짧은 시간에 렌더러가 반복해서 죽으면 재생성 루프를 멈춘다. */
export const WEBVIEW_RECOVERY_WINDOW_MS = 20_000;
export const WEBVIEW_RECOVERY_MAX = 3;
/** 와이파이가 붙는 동안처럼 로딩이 끝나지 않으면 새로고침을 보여 준다. */
export const WEBVIEW_LOAD_WATCH_MS = 15_000;

export type WebViewRecoveryAction = "remount" | "wait";

export function rememberWebViewUrl(current: string, next: string): string {
  const trimmed = next.trim();
  if (!trimmed || trimmed === "about:blank") return current;
  return trimmed;
}

export function decideWebViewRecovery(
  previousDeaths: number[],
  now: number,
): { action: WebViewRecoveryAction; deaths: number[] } {
  const deaths = previousDeaths
    .filter((at) => now - at < WEBVIEW_RECOVERY_WINDOW_MS)
    .concat(now);
  if (deaths.length > WEBVIEW_RECOVERY_MAX) {
    return { action: "wait", deaths };
  }
  return { action: "remount", deaths };
}
