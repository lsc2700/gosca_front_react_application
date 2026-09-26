/** 웹에서 readNativeInjectedFcmToken / waitForNativeInjectedFcmToken 과 짝 */
export function buildInjectNativeFcmTokenScript(token: string): string {
  const enc = JSON.stringify(token);
  return `(function(){try{window.__GOSCA_NATIVE_FCM_TOKEN__=${enc};window.dispatchEvent(new CustomEvent('goscaNativeFcmToken'));}catch(e){}})();true;`;
}

type WebViewInjectTarget = { injectJavaScript: (script: string) => void } | null;

export function injectNativeFcmIntoWebView(
  wv: WebViewInjectTarget,
  token: string | null,
): void {
  if (!wv || !token) {
    return;
  }
  wv.injectJavaScript(buildInjectNativeFcmTokenScript(token));
}

export function buildInjectNativeAppMetaScript(meta: {
  version: string;
  platform: string;
  bundleId: string;
  nativeAd?: boolean;
}): string {
  const enc = JSON.stringify(meta);
  return `(function(){try{window.__GOSCA_NATIVE_APP__=${enc};}catch(e){}})();true;`;
}

export function injectNativeAppMetaIntoWebView(
  wv: WebViewInjectTarget,
  meta: { version: string; platform: string; bundleId: string; nativeAd?: boolean },
): void {
  if (!wv) {
    return;
  }
  wv.injectJavaScript(buildInjectNativeAppMetaScript(meta));
}

/** 웹 `goscaAdMobResult` — 쪽지함은 네이티브 실패 시 하단 배너, 그것도 실패면 미표기 */
export function buildInjectAdMobResultScript(result: {
  kind: "native" | "banner";
  ok: boolean;
  slot?: string;
}): string {
  const detail = JSON.stringify(result);
  return `(function(){try{window.dispatchEvent(new CustomEvent('goscaAdMobResult',{detail:${detail}}));}catch(e){}})();true;`;
}

/** 웹 `requestUserNotificationPermission` — `goscaNativeNotificationPermission` 수신 */
export function buildInjectNotificationPermissionResultScript(
  granted: boolean,
): string {
  const detail = JSON.stringify({ granted });
  return `(function(){try{window.dispatchEvent(new CustomEvent('goscaNativeNotificationPermission',{detail:${detail}}));}catch(e){}})();true;`;
}
