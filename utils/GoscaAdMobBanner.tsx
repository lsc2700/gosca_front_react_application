import { useEffect, useState } from "react";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { Platform, View } from "react-native";
import * as TrackingTransparency from "expo-tracking-transparency";
import { ADMOB_BANNER_UNIT_ID } from "./adMobConfig";

/** 웹 완료 화면이 비워 둔 320×100 자리에 겹쳐 붙는 애드몹 배너 */
export function GoscaAdMobBanner() {
  const [npa, setNpa] = useState(true);

  useEffect(() => {
    if (Platform.OS !== "ios") {
      setNpa(false);
      return;
    }
    TrackingTransparency.getTrackingPermissionsAsync()
      .then((result) => setNpa(result.status !== "granted"))
      .catch(() => setNpa(true));
  }, []);

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
        requestOptions={{ requestNonPersonalizedAdsOnly: npa }}
      />
    </View>
  );
}
