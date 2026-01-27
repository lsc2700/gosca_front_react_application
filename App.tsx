// import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Dimensions,
  Linking,
  Platform,
  View,
} from "react-native";
import WebView from "react-native-webview";

import { ConvertUrl } from "@tosspayments/widget-sdk-react-native/src/utils/convertUrl";
import { SafeAreaView } from "react-native-safe-area-context";
import { iosSchemes } from "./constants/iosSchemes";

interface navType {
  url: string;
  canGoBack: boolean;
}

// interface locationData {
//   platform: string | number | null;
//   accuracy: string | number | null;
//   altitude: string | number | null;
//   altitudeAccuracy: string | number | null;
//   heading: string | number | null;
//   latitude: string | number | null;
//   longitude: string | number | null;
//   speed: string | number | null;
//   timestamp: string | number | null;
//   error?: {
//     code?: number; // 에러 코드
//     message?: string;
//   };
// }

const url = "https://apis.gosca.co.kr/storeLists/gosca";

export default function App() {
  const deviceHeight = Dimensions.get("window").height;
  const deviceWidth = Dimensions.get("window").width;
  const webviewRef = useRef<WebView>(null);
  // const [location, setLocation] = useState<locationData>({
  //   platform: Platform.OS,
  //   accuracy: null,
  //   altitude: null,
  //   altitudeAccuracy: null,
  //   heading: null,
  //   latitude: null,
  //   longitude: null,
  //   speed: null,
  //   timestamp: null,
  // });

  const [navState, setNavState] = useState({
    url: "",
    canGoBack: false,
  });

  const close = () => {
    Alert.alert("종료하시겠어요?", "확인을 누르면 종료합니다.", [
      {
        text: "취소",
        onPress: () => { },
        style: "cancel",
      },
      { text: "확인", onPress: () => BackHandler.exitApp() },
    ]);
  };

  useEffect(() => {
    const handleBackButton = () => {
      if (navState.canGoBack) {
        if (navState.url === url) {
          close();
        } else {
          webviewRef.current?.goBack();
        }
      } else {
        close();
      }
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackButton
    );

    return () => {
      subscription.remove(); // ✅ 최신 방식
    };
  }, [navState]);

  // 웹뷰로부터 메시지 수신
  // const onMessage = (event: { nativeEvent: { data: string } }) => {
  //   try {
  //     // JSON 파싱 시도
  //     const message = JSON.parse(event.nativeEvent.data);

  //     // 메시지 객체에 type 속성이 있을 경우 처리
  //     if (message.type === "loaded") {
  //       // React Native에서 웹뷰로 위치 정보 전송
  //       if (webviewRef.current && location) {
  //         webviewRef.current.postMessage(JSON.stringify(location));
  //       } else {
  //         console.error("Error", "Location is not available yet");
  //       }
  //     }
  //   } catch (error) {
  //     // JSON 파싱 실패 시 일반 텍스트 메시지 처리
  //     console.error("Failed to parse message:", error);
  //   }
  // };

  const forceHttps = (toUrl: string) => {
    // 현재 로딩 멈추고, JS로 강제 이동
    webviewRef.current?.stopLoading?.();
    webviewRef.current?.injectJavaScript?.(`
      (function() {
        try { window.location.replace(${JSON.stringify(toUrl)}); } catch(e) {}
      })();
      true;
    `);
  };

  const handleShouldStartLoadWithRequest = (event: any) => {
    const { url } = event;

    if (url === "http://www.gosca.co.kr/login") {
      forceHttps("https://www.gosca.co.kr/login");
      return false; // WebView가 http 로드 못 하게 차단
    }
    
    if (Platform.OS === "ios") {
      const scheme = url.split(":")[0] + "://"; // URL의 스킴 추출
      if (iosSchemes.includes(scheme)) {
        Linking.openURL(url)
          .then(() => console.log("URL 성공적으로 열림:", url))
          .catch((err) => {
            console.error("URL 열기에 실패함:", err);
            Alert.alert(
              "앱이 설치되어 있지 않습니다,",
              " 앱 설치 후 다시 시도해주세요."
            );
          });

        return false; // WebView에서 로드하지 않음
      } else {
        return true;
      }
    } else if (Platform.OS === "android") {
      if (url.startsWith('intent:')) {
        const cvt = new ConvertUrl(url);
        cvt.launchApp().catch(() => { });
        return false; // WebView 로드 금지
      }

      const NON_HTTP = /^(tel|mailto|sms|geo|kakaotalk|kakaopay|ispmobile|hdcardappcardansimclick|shinhan-sr-ansimclick|kb-acp|nhappcardansimclick|nhallonepayansimclick|lpayapp|payco|citispay|hanawalletmembers|cloudpay|mpocket\.online\.ansimclick|kftc-bankpay|supertoss|kbbank|liivbank|newliiv|wooripay|citimobileapp|kakaobank):/i;
      // 2) 카드/은행 등 비-HTTP 스킴 → 외부 앱으로
      if (NON_HTTP.test(url)) {
        Linking.openURL(url).catch(() => { });
        return false;
      }

      // 3) 마켓 링크 → 외부로
      if (url.startsWith('market://') || url.includes('play.google.com/store/apps')) {
        Linking.openURL(url).catch(() => { });
        return false;
      }

      return true;
    }

    return true;
  };

  // const sendLocationToState = async () => {
  //   if (location.longitude === null || location.latitude === null) {
  //     try {
  //       // 위치 권한 요청
  //       let { status } = await Location.requestForegroundPermissionsAsync();

  //       if (status !== "granted") {
  //         // 알림이 이미 표시된 적이 있는지 확인
  //         const hasShownAlert = await AsyncStorage.getItem(
  //           "hasShownLocationAlert"
  //         );

  //         if (!hasShownAlert) {
  //           // 권한 거부 시 처리
  //           Alert.alert(
  //             "위치 권한 필요",
  //             "위치 권한이 거부되었습니다. 추후 주변 공간을 찾으시려면 설정에서 변경해주세요.",
  //             [
  //               { text: "취소", style: "cancel" },
  //               {
  //                 text: "설정으로 이동",
  //                 onPress: () => Linking.openSettings(),
  //               },
  //             ]
  //           );

  //           // 알림이 표시된 것으로 설정
  //           await AsyncStorage.setItem("hasShownLocationAlert", "true");
  //         }

  //         // 권한 거부 시 location에 에러 정보 저장
  //         setLocation({
  //           platform: Platform.OS,
  //           accuracy: null,
  //           altitude: null,
  //           altitudeAccuracy: null,
  //           heading: null,
  //           latitude: null,
  //           longitude: null,
  //           speed: null,
  //           timestamp: null,
  //           error: {
  //             code: 1,
  //             message: "Permission to access location was denied",
  //           },
  //         });

  //         return; // 함수 종료
  //       }

  //       // 위치 정보 요청
  //       const locationResult = await Location.getCurrentPositionAsync({
  //         accuracy: Location.Accuracy.Balanced, // 정확도 설정
  //       });

  //       // 위치 정보와 플랫폼 정보 병합하여 location 상태에 저장
  //       const locationWithPlatform = {
  //         platform: Platform.OS,
  //         latitude: locationResult.coords.latitude,
  //         longitude: locationResult.coords.longitude,
  //         altitude: locationResult.coords.altitude,
  //         accuracy: locationResult.coords.accuracy,
  //         altitudeAccuracy: locationResult.coords.altitudeAccuracy,
  //         heading: locationResult.coords.heading,
  //         speed: locationResult.coords.speed,
  //         timestamp: locationResult.timestamp, // timestamp 추가
  //       };

  //       setLocation(locationWithPlatform); // location 상태 업데이트
  //     } catch (error) {
  //       // 에러 발생 시 location에 에러 정보 저장
  //       setLocation({
  //         platform: Platform.OS,
  //         accuracy: null,
  //         altitude: null,
  //         altitudeAccuracy: null,
  //         heading: null,
  //         latitude: null,
  //         longitude: null,
  //         speed: null,
  //         timestamp: null,
  //         error: {
  //           code: 0, // 에러 코드
  //           message: "Unknown error occurred while obtaining location", // 에러 메시지
  //         },
  //       });
  //     }
  //   }
  // };

  // useEffect(() => {
  //   sendLocationToState(); // WebView와 상관없이 위치 요청을 한 번만 수행
  // }, []);

  // useEffect(() => {
  //   // 처음 컴포넌트가 마운트될 때만 호출
  //   if (
  //     webviewRef.current &&
  //     (location.longitude !== null || location.latitude !== null)
  //   ) {
  //     webviewRef.current.postMessage(JSON.stringify(location));
  //   }
  // }, [location]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        width: deviceWidth,
        height: deviceHeight,
      }}
    >
      <View style={{ flex: 1 }}>
        <WebView
          ref={webviewRef}
          source={{ uri: url }}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={["*"]}
          setSupportMultipleWindows={true}
          javaScriptCanOpenWindowsAutomatically={true}
          injectedJavaScriptBeforeContentLoaded={`
            (function() {
              var _open = window.open;
              window.open = function(u){
                try {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ __popupOpen__: u }));
                } catch (e) {}
                return null;
              };
            })();
            true;
          `}
          allowsBackForwardNavigationGestures
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          mixedContentMode="always"
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          // onMessage={onMessage}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn("WebView error: ", nativeEvent);
          }}
          // injectedJavaScript={`
          //   document.addEventListener('DOMContentLoaded', () => {
          //     window.alert = function(message) {
          //       window.ReactNativeWebView.postMessage(message);
          //     };
          //   });
          // `}
          onNavigationStateChange={(nav: navType) => {
            setNavState({ url: nav.url, canGoBack: nav.canGoBack });
          }}
          onContentProcessDidTerminate={() => {
            if (Platform.OS === 'android') {
              webviewRef.current?.reload();
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}
