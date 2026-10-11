import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Text, View } from "react-native";
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
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

/**
 * 화면 밖에 두되 구글 최소(32)보다 크게 잡아 둔다.
 * 8px로 만들면 광고가 그 크기에 묶여, 나중에 칸으로 옮겨도 내용이 비어 있다.
 */
const parked = {
  opacity: 1,
  left: 0,
  top: -4000,
  width: 360,
  height: 50,
};

/**
 * 목록 칸 위에 네이티브 고급형을 겹친다.
 * 가로는 웹이 준 칸을 꽉 채우고, 세로는 한 줄만 쓴다.
 * 영상 미디어는 넣지 않는다. 50px 칸 밖으로 뚫고 나와 버튼을 가리기 때문이다.
 * 광고가 켜졌다 꺼질 때 뷰를 없애지 않는다. 없애면 웹뷰 레이아웃이 같이 멈추기 때문이다.
 * 앱을 열 때 뜨는 앱 오프닝 광고는 쓰지 않는다.
 */
export const GoscaAdMobNative = forwardRef<
  NativeAdController,
  { onStatus: (status: "loading" | "ok" | "fail") => void }
>(function GoscaAdMobNative({ onStatus }, ref) {
  const hostRef = useRef<View>(null);
  const [ad, setAd] = useState<NativeAd | null>(null);
  const [box, setBox] = useState(parked);

  const place = (frame: NativeFeedFrame | null) => {
    if (!hostRef.current) return;
    if (!frame || frame.width < 32 || frame.height < 32) {
      setBox(parked);
      return;
    }
    setBox({
      opacity: 1,
      left: frame.x,
      top: frame.y,
      width: frame.width,
      height: frame.height,
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
      pointerEvents={box.top < 0 ? "none" : "box-none"}
      collapsable={false}
      style={{ position: "absolute", overflow: "hidden", ...box }}
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
          <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
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
