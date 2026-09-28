import ExpoModulesCore
import WebKit

public class GoscaCookieFlushModule: Module {
  public func definition() -> ModuleDefinition {
    Name("GoscaCookieFlush")

    AsyncFunction("flush") { (promise: Promise) in
      DispatchQueue.main.async {
        WKWebsiteDataStore.default().httpCookieStore.getAllCookies { _ in
          promise.resolve(nil)
        }
      }
    }
  }
}
