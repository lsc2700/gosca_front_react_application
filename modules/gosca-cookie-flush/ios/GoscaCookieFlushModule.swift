import ExpoModulesCore
import WebKit

public class GoscaCookieFlushModule: Module {
  public func definition() -> ModuleDefinition {
    Name("GoscaCookieFlush")

    AsyncFunction("flush") { (promise: Promise) in
      DispatchQueue.main.async {
        let store = WKWebsiteDataStore.default().httpCookieStore
        store.getAllCookies { cookies in
          let shared = HTTPCookieStorage.shared
          for cookie in cookies {
            shared.setCookie(cookie)
          }
          promise.resolve(nil)
        }
      }
    }
  }
}
