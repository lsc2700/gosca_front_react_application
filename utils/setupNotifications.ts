import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import type { NotificationPermissionsRequest } from "expo-notifications";
import { PermissionsAndroid, Platform } from "react-native";
import { ensureNotifeeChannels } from "./groupedNotifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** FCM 등록 토큰. iOS APNs(64 hex)·Expo 토큰은 서버에 넣으면 기종별로 실패한다. */
export function isLikelyFcmRegistrationToken(token: string): boolean {
  const t = token.trim();
  if (t.length < 80) return false;
  if (/^ExponentPushToken/i.test(t)) return false;
  if (/^[0-9a-f]{64}$/i.test(t)) return false;
  return true;
}

function iosAllowsRemoteToken(
  perm: Notifications.NotificationPermissionsStatus,
): boolean {
  if (perm.status === "granted" || perm.granted) return true;
  const ios = perm.ios?.status;
  return (
    ios === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    ios === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    ios === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

const IOS_PERMISSIONS: NotificationPermissionsRequest = {
  ios: {
    allowAlert: true,
    allowBadge: true,
    allowSound: true,
  },
};

async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }
  await Promise.all([
    Notifications.setNotificationChannelAsync("default", {
      name: "고스카 알림",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: "default",
      showBadge: true,
    }),
    Notifications.setNotificationChannelAsync("gosca_admin", {
      name: "관리자 메시지",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: "default",
      showBadge: true,
    }),
    Notifications.setNotificationChannelAsync("gosca_inbox", {
      name: "쪽지",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: "default",
      showBadge: true,
    }),
    Notifications.setNotificationChannelAsync("gosca_system", {
      name: "시스템 메세지",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: "default",
      showBadge: true,
    }),
    Notifications.setNotificationChannelAsync("gosca_chat", {
      name: "채팅 알림",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: "default",
      showBadge: true,
    }),
    Notifications.setNotificationChannelAsync("gosca_purchase", {
      name: "이용권·룸·사물함 구매",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: "default",
      showBadge: true,
    }),
    Notifications.setNotificationChannelAsync("gosca_usage", {
      name: "좌석·사물함 이용",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: "default",
      showBadge: true,
    }),
  ]);
}

async function requestAndroidPostNotifications(): Promise<void> {
  if (Platform.OS !== "android") return;
  const api =
    typeof Platform.Version === "number"
      ? Platform.Version
      : Number.parseInt(String(Platform.Version), 10);
  if (!Number.isFinite(api) || api < 33) return;
  try {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
  } catch {
    /* expo-notifications 가 이미 요청한 기기 */
  }
}

async function requestIosFirebasePermission(): Promise<void> {
  if (Platform.OS !== "ios") return;
  try {
    await messaging().requestPermission({
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    });
  } catch {
    /* 이미 결정된 기기 */
  }
}

async function registerIosForRemote(): Promise<void> {
  if (Platform.OS !== "ios") return;
  try {
    if (!messaging().isDeviceRegisteredForRemoteMessages) {
      await messaging().registerDeviceForRemoteMessages();
    }
  } catch {
    try {
      await messaging().registerDeviceForRemoteMessages();
    } catch {
      /* iOS 18 일부 기종은 이미 등록됨 */
    }
  }
}

/** 최신 iPhone은 APNs 토큰이 늦게 와서 getToken()이 빈 값/에러가 난다. */
async function waitForIosApnsToken(maxMs = 12000): Promise<void> {
  if (Platform.OS !== "ios") return;
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    try {
      const apns = await messaging().getAPNSToken();
      if (typeof apns === "string" && apns.length > 0) return;
    } catch {
      /* keep waiting */
    }
    await sleep(400);
  }
}

async function fetchFcmTokenWithRetry(): Promise<string | null> {
  try {
    await messaging().setAutoInitEnabled(true);
  } catch {
    /* */
  }
  await registerIosForRemote();
  await waitForIosApnsToken();
  for (let i = 0; i < 4; i += 1) {
    try {
      const fcm = await messaging().getToken();
      if (typeof fcm === "string" && isLikelyFcmRegistrationToken(fcm)) {
        return fcm;
      }
    } catch {
      /* retry — 삼성/샤오미/iOS 18 첫 실행 */
    }
    await sleep(500 * (i + 1));
  }
  if (Platform.OS === "android") {
    try {
      const push = await Notifications.getDevicePushTokenAsync();
      const data = push?.data;
      if (typeof data === "string" && isLikelyFcmRegistrationToken(data)) {
        return data;
      }
    } catch {
      /* */
    }
  }
  return null;
}

async function ensureChannels(): Promise<void> {
  await ensureAndroidChannels();
  try {
    await ensureNotifeeChannels();
  } catch {
    /* notifee 미초기화 기기 */
  }
}

/** WebView에서 재요청할 때 사용 — OS 알림 권한 시트 */
export async function requestExpoNotificationPermission(): Promise<boolean> {
  await ensureChannels();
  await requestAndroidPostNotifications();
  const cur = await Notifications.getPermissionsAsync();
  if (iosAllowsRemoteToken(cur)) {
    await requestIosFirebasePermission();
    return true;
  }
  const next = await Notifications.requestPermissionsAsync(IOS_PERMISSIONS);
  await requestIosFirebasePermission();
  return iosAllowsRemoteToken(next);
}

export async function setupAppNotifications(): Promise<void> {
  await ensureChannels();
  await requestAndroidPostNotifications();
  const existing = await Notifications.getPermissionsAsync();
  if (!iosAllowsRemoteToken(existing)) {
    await Notifications.requestPermissionsAsync(IOS_PERMISSIONS);
  }
  await requestIosFirebasePermission();
}

/**
 * FCM 등록 토큰 (Android·iOS 공통). google-services / GoogleService-Info 필요.
 * iOS APNs 토큰은 넣지 않는다(서버가 FCM만 보낸다).
 */
export async function fetchDevicePushToken(): Promise<string | null> {
  const perm = await Notifications.getPermissionsAsync();
  if (!iosAllowsRemoteToken(perm)) {
    return null;
  }
  return fetchFcmTokenWithRetry();
}
