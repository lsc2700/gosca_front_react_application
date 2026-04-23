import messaging from "@react-native-firebase/messaging";
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

/** FCM `AndroidNotification.channelId` / data.category 와 동일 ID (fcm-service 기준) */
async function ensureAndroidFcmChannels(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }
  const high = {
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: "default" as const,
  };
  await Notifications.setNotificationChannelAsync("default", {
    name: "고스카 알림",
    ...high,
  });
  await Notifications.setNotificationChannelAsync("gosca_chat", {
    name: "채팅",
    ...high,
  });
  await Notifications.setNotificationChannelAsync("gosca_booking", {
    name: "예약·일정",
    ...high,
  });
}

/** WebView에서 재요청할 때 사용 — OS 알림 권한 시트 */
export async function requestExpoNotificationPermission(): Promise<boolean> {
  await ensureAndroidFcmChannels();
  const cur = await Notifications.getPermissionsAsync();
  if (cur.status === "granted") {
    return true;
  }
  const next = await Notifications.requestPermissionsAsync();
  return next.status === "granted";
}

export async function setupAppNotifications(): Promise<void> {
  await ensureAndroidFcmChannels();

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing !== "granted") {
    await Notifications.requestPermissionsAsync();
  }
}

/**
 * FCM 등록 토큰 (Android·iOS 공통). 네이티브 빌드 + google-services / GoogleService-Info 필요.
 * RN Firebase 미포함 빌드에서는 expo-notifications 토큰으로 폴백.
 */
export async function fetchDevicePushToken(): Promise<string | null> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    return null;
  }
  try {
    if (Platform.OS === "ios") {
      await messaging().registerDeviceForRemoteMessages();
    }
    const fcm = await messaging().getToken();
    if (typeof fcm === "string" && fcm.length > 0) {
      return fcm;
    }
  } catch {
    /* fall through */
  }
  try {
    const push = await Notifications.getDevicePushTokenAsync();
    const data = push?.data;
    return typeof data === "string" && data.length > 0 ? data : null;
  } catch {
    return null;
  }
}
