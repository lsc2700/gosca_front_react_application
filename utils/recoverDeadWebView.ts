/** 짧은 시간에 렌더러가 반복해서 죽으면 재생성 루프를 멈춘다. */
export const WEBVIEW_RECOVERY_WINDOW_MS = 20_000;
export const WEBVIEW_RECOVERY_MAX = 3;
/** 첫 로딩이 끝나지 않을 때만 새로고침을 보여 준다. 이미 뜬 화면에는 쓰지 않는다. */
export const WEBVIEW_LOAD_WATCH_MS = 15_000;
/**
 * 문서 로딩 완료(onLoadEnd) 전에 화면은 이미 그려진다.
 * 광고 스크립트가 로딩 완료를 60초까지 붙잡아도, 이 진행률이면 실패 화면으로 가리지 않는다.
 */
export const WEBVIEW_PAINT_PROGRESS = 0.1;

export function hasWebViewPainted(progress: number): boolean {
  return Number.isFinite(progress) && progress >= WEBVIEW_PAINT_PROGRESS;
}

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

/** 버튼을 연달아 누르면 이전 로드가 취소되며, 그건 화면 고장이 아니다. */
export function isCancelledWebViewLoad(input: {
  code?: number;
  description?: string;
}): boolean {
  const code = Number(input.code);
  if (code === -3 || code === -999) return true;
  const description = String(input.description ?? "");
  return /ERR_ABORTED|NSURLErrorCancelled|cancelled|canceled/i.test(description);
}

/**
 * 새로고침 버튼으로 화면을 가리지 않는다.
 * 로딩이 늦거나 광고가 붙잡혀도 웹뷰는 그대로 두고, 아직 아무것도 안 그려졌을 때만 조용히 다시 연다.
 */
export function shouldCoverWithRefresh(_input: {
  reason: string;
  pageShown: boolean;
  recovering: boolean;
  cancelled?: boolean;
}): boolean {
  return false;
}
