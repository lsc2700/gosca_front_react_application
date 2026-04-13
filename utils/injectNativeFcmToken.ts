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
