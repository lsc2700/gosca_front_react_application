import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { View } from "react-native";
import { ADMOB_BANNER_UNIT_ID } from "./adMobConfig";

/** 웹 완료 화면이 비워 둔 320×100 자리에 겹쳐 붙는 애드몹 배너 */
export function GoscaAdMobBanner() {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 100,
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      <BannerAd
        unitId={ADMOB_BANNER_UNIT_ID}
        size={BannerAdSize.LARGE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}
