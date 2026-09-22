import Constants from "expo-constants";
import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

/**
 * 정산: gosca88 개인(이승찬).
 * 앱 ID·배너 단위는 스토어 앱마다 다르다. 고스카 단위를 르하임·앤딩에 넣지 말 것.
 * 개발 배너는 TestIds.BANNER.
 */
export type AdMobBrand = "gosca" | "lchayim" | "anding";

export const ADMOB_APP_IDS: Record<AdMobBrand, { android: string; ios: string }> = {
  gosca: {
    android: "ca-app-pub-8070999135501104~3633464490",
    ios: "ca-app-pub-8070999135501104~9027418093",
  },
  lchayim: {
    android: "ca-app-pub-8070999135501104~9017421608",
    ios: "ca-app-pub-8070999135501104~3573523239",
  },
  anding: {
    android: "ca-app-pub-8070999135501104~3138408968",
    ios: "ca-app-pub-8070999135501104~6886082281",
  },
};

/** 앱별 complete-bottom 배너. 고스카 단위를 르하임·앤딩에 넣지 말 것. */
export const ADMOB_BANNER_UNITS: Record<AdMobBrand, { android: string; ios: string }> = {
  gosca: {
    android: "ca-app-pub-8070999135501104/7571253234",
    ios: "ca-app-pub-8070999135501104/4367961663",
  },
  lchayim: {
    android: "ca-app-pub-8070999135501104/3269715991",
    ios: "ca-app-pub-8070999135501104/4016566319",
  },
  anding: {
    android: "ca-app-pub-8070999135501104/9533898132",
    ios: "ca-app-pub-8070999135501104/7069360202",
  },
};

type ExtraAdMob = {
  brand?: AdMobBrand;
  androidBannerUnitId?: string;
  iosBannerUnitId?: string;
};

function extraAdMob(): ExtraAdMob | undefined {
  return (Constants.expoConfig?.extra as { adMob?: ExtraAdMob } | undefined)?.adMob;
}

function currentPackageOrBundle(): string {
  if (Platform.OS === "ios") {
    return String(Constants.expoConfig?.ios?.bundleIdentifier ?? "");
  }
  return String(Constants.expoConfig?.android?.package ?? "");
}

export function resolveAdMobBrand(packageOrBundle?: string | null): AdMobBrand {
  const id = String(packageOrBundle || "").toLowerCase();
  if (id.includes("lchayim")) return "lchayim";
  if (id.includes("anding")) return "anding";
  return "gosca";
}

export function resolveAdMobBrandFromNative(): AdMobBrand {
  const extraBrand = extraAdMob()?.brand;
  if (extraBrand === "lchayim" || extraBrand === "anding" || extraBrand === "gosca") {
    return extraBrand;
  }
  return resolveAdMobBrand(currentPackageOrBundle());
}

const brand = resolveAdMobBrandFromNative();

export const ADMOB_ANDROID_APP_ID = ADMOB_APP_IDS[brand].android;
export const ADMOB_IOS_APP_ID = ADMOB_APP_IDS[brand].ios;

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (value) return value;
  }
  return "";
}

function productionBannerUnitId(): string {
  const extra = extraAdMob();
  const units = ADMOB_BANNER_UNITS[brand];
  if (Platform.OS === "ios") {
    return firstNonEmpty(extra?.iosBannerUnitId, units.ios);
  }
  if (Platform.OS === "android") {
    return firstNonEmpty(extra?.androidBannerUnitId, units.android);
  }
  return TestIds.BANNER;
}

/** 완료 화면 하단 LARGE_BANNER 320×100. 개발은 테스트 배너. */
export const ADMOB_BANNER_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : productionBannerUnitId();
