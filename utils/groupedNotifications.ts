import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FirebaseMessagingTypes } from "@react-native-firebase/messaging";
import notifee, { AndroidImportance, AndroidStyle } from "@notifee/react-native";
import { Platform } from "react-native";

const GROUP_COUNT_KEY_PREFIX = "gosca_group_count:";

/** 서버 FcmPushService.resolveAndroidChannelId 와 동일한 분류(표시용 라벨만 앱에서 한글화) */
type GroupKind = "admin" | "chat" | "purchase" | "usage" | "default";

const GROUP_KIND_LABEL: Record<GroupKind, string> = {
  admin: "관리자 메시지",
  chat: "채팅 알림",
  purchase: "이용권·룸·사물함 구매",
  usage: "좌석·사물함 이용",
  default: "알림",
};

function compactText(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function normalizeMultilineBody(input: string): string {
  const normalized = input.replace(/\r\n/g, "\n").replace(/\\n/g, "\n");
  const lines = normalized.split("\n").map((line) => compactText(line));

  if (lines.length === 0 || lines.every((line) => line.length === 0)) {
    return "새 알림이 도착했습니다.";
  }

  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].length === 0) {
    start++;
  }
  while (end > start && lines[end - 1].length === 0) {
    end--;
  }
  return lines.slice(start, end).join("\n");
}

function pickTitle(msg: FirebaseMessagingTypes.RemoteMessage): string {
  const t = msg.data?.title ?? msg.notification?.title;
  if (typeof t === "string" && t.length > 0) {
    return compactText(t);
  }
  return "고스카";
}

function pickBody(msg: FirebaseMessagingTypes.RemoteMessage): string {
  const b = msg.data?.body ?? msg.notification?.body;
  if (typeof b !== "string" || b.length === 0) {
    return "새 알림이 도착했습니다.";
  }
  return normalizeMultilineBody(b);
}

function buildAndroidChildStyle(body: string):
  | { type: typeof AndroidStyle.INBOX; lines: string[] }
  | { type: typeof AndroidStyle.BIGTEXT; text: string } {
  const lines = body.split("\n").filter((line) => line.length > 0);
  if (lines.length > 1) {
    return {
      type: AndroidStyle.INBOX,
      lines: lines.slice(0, 25),
    };
  }
  return { type: AndroidStyle.BIGTEXT, text: body };
}

function normalizeKind(msg: FirebaseMessagingTypes.RemoteMessage): GroupKind {
  const raw = (msg.data?.type ?? "").toUpperCase();
  if (raw.includes("CHAT") || raw.includes("MESSAGE") || raw.includes("DM")) {
    return "chat";
  }
  if (raw.includes("MASTER_BROADCAST") || raw.startsWith("MASTER_")) {
    return "admin";
  }
  if (
    raw.includes("SEAT_EXIT") ||
    raw.includes("SEAT_USE_START") ||
    raw.includes("LOCKER_USE_START")
  ) {
    return "usage";
  }
  if (
    raw.includes("PASS_PURCHASE") ||
    raw.includes("STUDY_ROOM_PURCHASE") ||
    raw.includes("BOOK") ||
    raw.includes("RESERV") ||
    raw.includes("SCHEDULE") ||
    raw.includes("예약")
  ) {
    return "purchase";
  }
  return "default";
}

function channelIdForKind(kind: GroupKind): string {
  switch (kind) {
    case "admin":
      return "gosca_admin";
    case "chat":
      return "gosca_chat";
    case "purchase":
      return "gosca_purchase";
    case "usage":
      return "gosca_usage";
    default:
      return "default";
  }
}

function groupKeyOf(msg: FirebaseMessagingTypes.RemoteMessage): string {
  const androidTag = msg.data?.androidTag;
  if (typeof androidTag === "string" && androidTag.length > 0) {
    return `gosca.tag.${androidTag}`;
  }
  const kind = normalizeKind(msg);
  if (kind === "chat") {
    const roomId = msg.data?.roomId;
    if (typeof roomId === "string" && roomId.length > 0) {
      return `gosca.chat.${roomId}`;
    }
  }
  return `gosca.${kind}`;
}

async function nextGroupCount(groupKey: string): Promise<number> {
  const storageKey = `${GROUP_COUNT_KEY_PREFIX}${groupKey}`;
  const prev = await AsyncStorage.getItem(storageKey);
  const n = Number.parseInt(prev ?? "0", 10);
  const next = Number.isFinite(n) && n > 0 ? n + 1 : 1;
  await AsyncStorage.setItem(storageKey, String(next));
  return next;
}

export async function ensureNotifeeChannels(): Promise<void> {
  await notifee.createChannel({
    id: "default",
    name: "고스카 알림",
    importance: AndroidImportance.HIGH,
    vibration: true,
    badge: true,
  });
  await notifee.createChannel({
    id: "gosca_admin",
    name: "관리자 메시지",
    importance: AndroidImportance.HIGH,
    vibration: true,
    badge: true,
  });
  await notifee.createChannel({
    id: "gosca_chat",
    name: "채팅 알림",
    importance: AndroidImportance.HIGH,
    vibration: true,
    badge: true,
  });
  await notifee.createChannel({
    id: "gosca_purchase",
    name: "이용권·룸·사물함 구매",
    importance: AndroidImportance.HIGH,
    vibration: true,
    badge: true,
  });
  await notifee.createChannel({
    id: "gosca_usage",
    name: "좌석·사물함 이용",
    importance: AndroidImportance.HIGH,
    vibration: true,
    badge: true,
  });
}

export async function displayGroupedAndroidNotification(
  msg: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  await ensureNotifeeChannels();

  const groupKey = groupKeyOf(msg);
  const groupKind = normalizeKind(msg);
  const channelId = channelIdForKind(groupKind);
  const count = await nextGroupCount(groupKey);
  const childId = msg.messageId ?? `${Date.now()}`;
  const summaryId = `summary:${groupKey}`;
  const title = pickTitle(msg);
  const body = pickBody(msg);

  const displayLines = body.split("\n").filter((line) => line.length > 0);
  const collapsedBody = displayLines[0] ?? body;

  await notifee.displayNotification({
    id: childId,
    title,
    body: collapsedBody,
    data: msg.data,
    android: {
      channelId,
      groupId: groupKey,
      smallIcon: "ic_launcher",
      pressAction: { id: "default" },
      style: buildAndroidChildStyle(body),
    },
  });

  await notifee.displayNotification({
    id: summaryId,
    title: "고스카",
    body: `${GROUP_KIND_LABEL[groupKind]} ${count}건`,
    android: {
      channelId,
      groupId: groupKey,
      groupSummary: true,
      smallIcon: "ic_launcher",
      pressAction: { id: "default" },
      number: count,
    },
  });

  await notifee.setBadgeCount(count);
}
