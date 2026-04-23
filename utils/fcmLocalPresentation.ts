/**
 * FCM 수신 후 로컬 알림(Notifee) — 앱이 포그라운드일 때만 의미 있음.
 * fcm-service는 `notification` + Android 채널 + data.category 를 보냄.
 *
 * Android: 동일 notification id로 갱신 + subtitle 누적 건수.
 * iOS: 포그라운드 배너용 Notifee.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FirebaseMessagingTypes } from "@react-native-firebase/messaging";
import notifee, { AndroidImportance } from "@notifee/react-native";
import { Platform } from "react-native";

const STORAGE_COUNT_KEY = "gosca_fcm_foreground_bundle_count";
const BUNDLE_NOTIFICATION_ID = "gosca_fcm_foreground_bundle";

const CHANNEL_LABELS: Record<string, string> = {
  default: "고스카 알림",
  gosca_chat: "채팅",
  gosca_booking: "예약·일정",
};

function readTitleBody(remoteMessage: FirebaseMessagingTypes.RemoteMessage): {
  title: string;
  body: string;
} {
  const d = remoteMessage.data ?? {};
  const title =
    (typeof d.title === "string" && d.title.length > 0
      ? d.title
      : remoteMessage.notification?.title) || "고스카";
  const body =
    (typeof d.body === "string" && d.body.length > 0
      ? d.body
      : remoteMessage.notification?.body) || "";
  return { title, body };
}

function resolveChannelId(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): string {
  const d = remoteMessage.data ?? {};
  const c = d.category;
  if (typeof c === "string" && c.trim().length > 0) {
    return c.trim();
  }
  return "default";
}

async function bumpForegroundCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(STORAGE_COUNT_KEY);
  const prev = raw ? parseInt(raw, 10) : 0;
  const next = Number.isFinite(prev) && prev >= 0 ? prev + 1 : 1;
  await AsyncStorage.setItem(STORAGE_COUNT_KEY, String(next));
  return next;
}

async function ensureNotifeeAndroidChannel(channelId: string): Promise<void> {
  const name = CHANNEL_LABELS[channelId] ?? CHANNEL_LABELS.default;
  await notifee.createChannel({
    id: channelId,
    name,
    importance: AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function presentFcmForegroundLocalNotification(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): Promise<void> {
  const { title, body } = readTitleBody(remoteMessage);
  const channelId = resolveChannelId(remoteMessage);

  if (Platform.OS === "android") {
    await ensureNotifeeAndroidChannel(channelId);
    const next = await bumpForegroundCount();
    await notifee.displayNotification({
      id: BUNDLE_NOTIFICATION_ID,
      title,
      body,
      android: {
        channelId,
        smallIcon: "ic_launcher",
        pressAction: { id: "default", launchActivity: "default" },
        showTimestamp: true,
        subtitle: `새 알림 ${next}건`,
      },
    });
    return;
  }

  await notifee.displayNotification({
    title,
    body,
    ios: {
      sound: "default",
      foregroundPresentationOptions: {
        badge: true,
        sound: true,
        banner: true,
        list: true,
      },
    },
  });
}
