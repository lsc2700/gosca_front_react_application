import { requireOptionalNativeModule } from "expo";

type GoscaCookieFlushNative = {
  flush: () => Promise<void>;
};

const native = requireOptionalNativeModule<GoscaCookieFlushNative>("GoscaCookieFlush");

/** Android writes the WebView cookie jar to disk. iOS touches the default cookie store. */
export function flushWebViewCookies(): void {
  void native?.flush()?.catch(() => undefined);
}
