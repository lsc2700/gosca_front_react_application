import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

/**
 * 정산: gosca88 개인(이승찬).
 * 앱 ID는 스토어 앱마다 다르고, 네이티브 바이너리에는 각 configs/app.*.json 플러그인 값이 들어간다.
 * 고스카 Android `~3633464490` / iOS `~9027418093`
 * 르하임 Android `~9017421608` / iOS `~3573523239`
 * 앤딩 Android `~3138408968` / iOS `~6886082281`
 * 세 앱이 같은 웹뷰(apis.gosca.co.kr)를 쓰므로 배너 단위는 같다.
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
