import { AppState, InteractionManager, Platform } from "react-native";
import mobileAds from "react-native-google-mobile-ads";
import * as TrackingTransparency from "expo-tracking-transparency";

function waitUntilAppActive(): Promise<void> {
  if (AppState.currentState === "active") {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        sub.remove();
        resolve();
      }
    });
  });
}

function waitAfterInteractions(): Promise<void> {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => resolve());
  });
}

/**
 * iOS는 ATT 팝업을 광고 SDK보다 먼저 띄운다.
 * 4.1.7 반려: 프레임워크는 있는데 추적 허용 창이 안 보임.
 */
export async function initAdMobAfterTracking(): Promise<void> {
  if (Platform.OS === "ios") {
    await waitUntilAppActive();
    await waitAfterInteractions();
    await new Promise((resolve) => setTimeout(resolve, 600));
    try {
      await TrackingTransparency.requestTrackingPermissionsAsync();
    } catch {
      /* 팝업 실패해도 비개인화 광고는 나갈 수 있게 초기화 */
    }
  }
  await mobileAds().initialize();
}
