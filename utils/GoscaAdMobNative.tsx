import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
} from "react-native-google-mobile-ads";
import { ADMOB_NATIVE_UNIT_ID } from "./adMobConfig";

export type NativeFeedFrame = {
  slot: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * 목록 칸 위에 네이티브 고급형을 겹친다.
 * 앱을 열 때 뜨는 앱 오프닝 광고는 쓰지 않는다.
 */
export function GoscaAdMobNative({
  frame,
  onStatus,
}: {
  frame: NativeFeedFrame | null;
  onStatus: (status: "loading" | "ok" | "fail") => void;
}) {
  const [ad, setAd] = useState<NativeAd | null>(null);

  useEffect(() => {
    if (!ADMOB_NATIVE_UNIT_ID) {
      onStatus("fail");
      return undefined;
    }
    let cancelled = false;
    let loaded: NativeAd | null = null;
    NativeAd.createForAdRequest(ADMOB_NATIVE_UNIT_ID)
      .then((next) => {
        if (cancelled) {
          next.destroy();
          return;
        }
        loaded = next;
        setAd(next);
        onStatus("ok");
      })
      .catch(() => {
        if (!cancelled) {
          setAd(null);
          onStatus("fail");
        }
      });
    return () => {
      cancelled = true;
      loaded?.destroy();
      setAd(null);
    };
  }, [onStatus]);

  if (!frame || !ad || frame.width < 8 || frame.height < 8) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: frame.x,
        top: frame.y,
        width: frame.width,
        height: frame.height,
      }}
    >
      <NativeAdView
        nativeAd={ad}
        style={{
          flex: 1,
          backgroundColor: "#fff",
          borderRadius: 10,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          padding: 8,
          overflow: "hidden",
        }}
      >
        <Text style={{ fontSize: 10, fontWeight: "800", color: "#6b7280" }}>광고</Text>
        <NativeAsset assetType={NativeAssetType.HEADLINE}>
          <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "800", color: "#111" }}>
            {ad.headline}
          </Text>
        </NativeAsset>
        <NativeMediaView style={{ height: 72, marginTop: 6, borderRadius: 8 }} />
        <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
          <Text style={{ marginTop: 6, fontSize: 13, fontWeight: "800", color: "#1d4ed8" }}>
            {ad.callToAction}
          </Text>
        </NativeAsset>
      </NativeAdView>
    </View>
  );
}
