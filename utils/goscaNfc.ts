import { requireOptionalNativeModule } from "expo";
import { DeviceEventEmitter, NativeModules, Platform } from "react-native";
import type WebView from "react-native-webview";
import { tokenFromNfcTagUrl } from "./nfcTagToken";

export type GoscaNfcEvent = { action?: string; url?: string };

type IosNfc = {
  ensureEnabled: () => void;
  release: () => void;
  prepareScan: () => void;
  prepareWrite: (url: string) => void;
  addListener: (
    event: string,
    listener: (event: GoscaNfcEvent) => void,
  ) => { remove: () => void };
};

function iosNfc(): IosNfc | null {
  return requireOptionalNativeModule<IosNfc>("GoscaNfcIos");
}

/** 안드로이드는 포그라운드 디스패치, 아이폰은 앱이 켜져 있을 때만 읽기 세션. */
export function subscribeGoscaNfc(onEvent: (event: GoscaNfcEvent) => void): () => void {
  if (Platform.OS === "android") {
    const sub = DeviceEventEmitter.addListener("GoscaNfc", onEvent);
    return () => sub.remove();
  }
  if (Platform.OS === "ios") {
    const native = iosNfc();
    if (!native?.addListener) return () => {};
    const sub = native.addListener("onTag", onEvent);
    return () => sub.remove();
  }
  return () => {};
}

export function prepareNfcScan(): void {
  if (Platform.OS === "ios") {
    iosNfc()?.prepareScan?.();
    return;
  }
  NativeModules.GoscaNfc?.prepareScan?.();
}

export function ensureNfcEnabled(): void {
  if (Platform.OS === "ios") {
    iosNfc()?.ensureEnabled?.();
    return;
  }
  NativeModules.GoscaNfc?.ensureEnabled?.();
}

/** 이 지점은 NFC를 쓰지 않는다. 읽기 세션을 내린다. */
export function releaseNfc(): void {
  if (Platform.OS === "ios") {
    iosNfc()?.release?.();
    return;
  }
  NativeModules.GoscaNfc?.release?.();
}

export function prepareNfcWrite(url: string): void {
  if (Platform.OS === "ios") {
    iosNfc()?.prepareWrite?.(url);
    return;
  }
  NativeModules.GoscaNfc?.prepareWrite?.(url);
}

function tokenFromTag(url: string | undefined): string {
  return tokenFromNfcTagUrl(url);
}

/** 웹의 subscribeNativeNfc 가 받는 메시지. 앱이 떠 있으면 화면은 그대로 두고, 브라우저만 /nfc/{token} 으로 연다. */
export function injectNfcToWeb(web: WebView | null, event: GoscaNfcEvent): void {
  if (!web || !event.action) return;
  const token = event.action === "tag" ? tokenFromTag(event.url) : "";
  const payload = JSON.stringify({
    type: "GOSCA_NFC",
    action: event.action,
    url: event.url,
    token,
  });
  const script = `(function(){try{var d=${JSON.stringify(payload)};var ev=new MessageEvent('message',{data:d});window.dispatchEvent(ev);document.dispatchEvent(ev);var token=${JSON.stringify(token)};var inApp=!!window.ReactNativeWebView||window.__goscaNfcInApp===true;if(token&&!inApp){var path='/nfc/'+encodeURIComponent(token);var onPage=location.pathname.indexOf('/nfc/')===0&&location.pathname.indexOf('/nfc/register')!==0;if(!onPage&&location.pathname!==path){location.assign(path);}}}catch(e){}})();true;`;
  web.injectJavaScript(script);
}
