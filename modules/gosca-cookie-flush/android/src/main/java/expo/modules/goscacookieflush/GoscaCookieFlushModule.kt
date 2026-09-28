package expo.modules.goscacookieflush

import android.webkit.CookieManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class GoscaCookieFlushModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("GoscaCookieFlush")

    AsyncFunction("flush") {
      CookieManager.getInstance().flush()
    }
  }
}
