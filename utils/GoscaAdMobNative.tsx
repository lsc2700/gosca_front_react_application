import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
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

export type NativeAdController = {
  /** 웹뷰를 다시 그리지 않고 광고 칸만 옮기거나 화면 밖으로 치운다. */
  place: (frame: NativeFeedFrame | null) => void;
};

const parked = {
  opacity: 0,
  left: 0,
  top: -4000,
  width: 8,
  height: 8,
};

/**
 * 목록 칸 위에 네이티브 고급형을 겹친다.
 * 가로는 웹이 준 칸을 꽉 채우고, 세로는 한 줄만 쓴다.
 * 광고가 켜졌다 꺼질 때 뷰를 없애지 않는다. 없애면 웹뷰 레이아웃이 같이 멈추기 때문이다.
 * 앱을 열 때 뜨는 앱 오프닝 광고는 쓰지 않는다.
 */
export const GoscaAdMobNative = forwardRef<
  NativeAdController,
  { onStatus: (status: "loading" | "ok" | "fail") => void }
>(function GoscaAdMobNative({ onStatus }, ref) {
  const hostRef = useRef<View>(null);
  const [ad, setAd] = useState<NativeAd | null>(null);

  const place = (frame: NativeFeedFrame | null) => {
    const node = hostRef.current;
    if (!node) return;
    if (!frame || frame.width < 8 || frame.height < 8) {
      node.setNativeProps({
        pointerEvents: "none",
        style: parked,
      });
      return;
    }
    node.setNativeProps({
      pointerEvents: "box-none",
      style: {
        opacity: 1,
        overflow: "hidden",
        left: frame.x,
        top: frame.y,
        width: frame.width,
        height: frame.height,
      },
    });
  };

  useImperativeHandle(ref, () => ({ place }), []);

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

  return (
    <View
      ref={hostRef}
      pointerEvents="none"
      collapsable={false}
      style={{ position: "absolute", ...parked }}
    >
      {ad ? (
        <NativeAdView
          nativeAd={ad}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#fff",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            paddingHorizontal: 8,
            overflow: "hidden",
          }}
        >
          <NativeMediaView style={{ width: 72, height: 40, borderRadius: 6 }} />
          <View style={{ flex: 1, minWidth: 0, marginHorizontal: 8 }}>
            <Text style={{ fontSize: 10, fontWeight: "800", color: "#6b7280" }}>광고</Text>
            <NativeAsset assetType={NativeAssetType.HEADLINE}>
              <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "800", color: "#111" }}>
                {ad.headline}
              </Text>
            </NativeAsset>
          </View>
          <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
            <Text numberOfLines={1} style={{ maxWidth: 88, fontSize: 12, fontWeight: "800", color: "#1d4ed8" }}>
              {ad.callToAction}
            </Text>
          </NativeAsset>
        </NativeAdView>
      ) : null}
    </View>
  );
});
