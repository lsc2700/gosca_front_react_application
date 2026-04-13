import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupAppNotifications(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "고스카 알림",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: "default",
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing !== "granted") {
    await Notifications.requestPermissionsAsync();
  }
}

/**
 * Android: FCM 등록 토큰. iOS: 기기 푸시 토큰(백엔드가 FCM만 받으면 iOS 별도 검증 필요).
 * Expo Go가 아닌 dev client / 스토어 빌드 + Firebase(google-services.json) 설정 필요.
 */
export async function fetchDevicePushToken(): Promise<string | null> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    return null;
  }
  try {
    const push = await Notifications.getDevicePushTokenAsync();
    const data = push?.data;
    return typeof data === "string" && data.length > 0 ? data : null;
  } catch {
    return null;
  }
}
