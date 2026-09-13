import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

/**
 * 정산: gosca88 개인(이승찬). Android는 Play `com.user.gosca`.
 * iOS 앱 ID는 콘솔에서 만든 뒤 교체. 개발 배너는 TestIds.BANNER.
 */
export const ADMOB_ANDROID_APP_ID = "ca-app-pub-8070999135501104~3633464490";
export const ADMOB_IOS_APP_ID = "ca-app-pub-3940256099942544~1458002511";

/** 완료 화면 하단 LARGE_BANNER 320×100. 개발은 테스트 배너. */
export const ADMOB_BANNER_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : Platform.select({
      ios: "ca-app-pub-3940256099942544/2934735716",
      android: "ca-app-pub-3940256099942544/6300978111",
      default: TestIds.BANNER,
    });
