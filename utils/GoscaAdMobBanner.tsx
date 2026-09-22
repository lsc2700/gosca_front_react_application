import { useEffect, useRef, useState } from "react";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { Platform, View } from "react-native";
import * as TrackingTransparency from "expo-tracking-transparency";
import { ADMOB_BANNER_UNIT_ID } from "./adMobConfig";

type Props = {
  /** 완료 화면일 때만 true. false여도 배너는 마운트해 미리 로드한다. */
  visible: boolean;
};

/**
 * 완료 화면보다 먼저 BannerAd를 올려 요청해 두고,
 * visible 이 되면 이미 로드된 배너를 화면 하단에 붙인다.
 * (완료 순간에야 마운트하면 1~2초 로드 동안 사용자가 나가 노출률이 떨어진다.)
 */
export function GoscaAdMobBanner({ visible }: Props) {
  const [npa, setNpa] = useState(true);
  const [loadKey, setLoadKey] = useState(0);
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== "ios") {
      setNpa(false);
      return;
    }
    TrackingTransparency.getTrackingPermissionsAsync()
      .then((result) => setNpa(result.status !== "granted"))
      .catch(() => setNpa(true));
  }, []);

  useEffect(() => {
    if (visible) {
      wasVisibleRef.current = true;
      return;
    }
    if (!wasVisibleRef.current) {
      return;
    }
    wasVisibleRef.current = false;
    // 숨긴 뒤 다음 완료 화면용으로 새 광고를 미리 받는다.
    const t = setTimeout(() => setLoadKey((k) => k + 1), 400);
    return () => clearTimeout(t);
  }, [visible]);

  if (!ADMOB_BANNER_UNIT_ID) {
    return null;
  }

  return (
    <View
      pointerEvents={visible ? "box-none" : "none"}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 100,
        alignItems: "center",
        justifyContent: "flex-end",
        opacity: visible ? 1 : 0,
        // 화면 밖으로 빼 두어 숨김 상태에서는 노출로 잡히지 않게 한다.
        transform: [{ translateY: visible ? 0 : 160 }],
      }}
    >
      <BannerAd
        key={loadKey}
        unitId={ADMOB_BANNER_UNIT_ID}
        size={BannerAdSize.LARGE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: npa }}
      />
    </View>
  );
}
