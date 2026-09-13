import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

/**
 * 정산: gosca88 개인(이승찬).
 * Android Play `com.user.gosca`, iOS App Store `1505155896`.
 * 고스카·르하임·앤딩 앱이 같은 웹뷰(apis.gosca.co.kr)를 쓰므로 배너 단위는 같다.
 * 개발 배너는 TestIds.BANNER.
 */
export const ADMOB_ANDROID_APP_ID = "ca-app-pub-8070999135501104~3633464490";
export const ADMOB_IOS_APP_ID = "ca-app-pub-8070999135501104~9027418093";

/** 완료 화면 하단 LARGE_BANNER 320×100. 개발은 테스트 배너. */
export const ADMOB_BANNER_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : Platform.select({
      ios: "ca-app-pub-8070999135501104/4367961663",
      android: "ca-app-pub-8070999135501104/7571253234",
      default: TestIds.BANNER,
    });
