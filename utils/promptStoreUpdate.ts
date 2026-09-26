import Constants from "expo-constants";
import { Alert, Linking, Platform } from "react-native";

export const GOSCA_IOS_STORE_URL = "https://apps.apple.com/kr/app/id1505155896";
export const GOSCA_ANDROID_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.user.gosca";
export const GOSCA_ANDROID_PREVIEW_URL =
  "https://expo.dev/accounts/gosca/projects/gosca";

const IOS_APP_ID = "1505155896";
const GOSCA_IOS_BUNDLE = "com.gosca.users";
const GOSCA_ANDROID_PACKAGE = "com.user.gosca";

export function parsePlayStoreVersion(html: string): string | null {
  const match = String(html).match(/\[\[\["(\d+\.\d+(?:\.\d+)?)"\]\]/);
  return match?.[1] ?? null;
}

function isGoscaStoreBinary(): boolean {
  if (Platform.OS === "ios") {
    return Constants.expoConfig?.ios?.bundleIdentifier === GOSCA_IOS_BUNDLE;
  }
  return Constants.expoConfig?.android?.package === GOSCA_ANDROID_PACKAGE;
}

function parseVersionParts(version: string): number[] {
  return String(version)
    .split(/[^\d]+/)
    .filter(Boolean)
    .map((part) => Number(part) || 0);
}

export function isVersionNewer(store: string, installed: string): boolean {
  const a = parseVersionParts(store);
  const b = parseVersionParts(installed);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const da = a[i] ?? 0;
    const db = b[i] ?? 0;
    if (da > db) return true;
    if (da < db) return false;
  }
  return false;
}

export function nativeStoreUrl(): string {
  if (Platform.OS === "ios") {
    return GOSCA_IOS_STORE_URL;
  }
  const pkg = Constants.expoConfig?.android?.package;
  if (pkg === "com.gosca.users") {
    return GOSCA_ANDROID_PREVIEW_URL;
  }
  return GOSCA_ANDROID_PLAY_URL;
}

export function openNativeStore(): void {
  void Linking.openURL(nativeStoreUrl());
}

async function fetchAndroidStoreVersion(): Promise<string | null> {
  try {
    const res = await fetch(
      `https://play.google.com/store/apps/details?id=${GOSCA_ANDROID_PACKAGE}&hl=ko&gl=KR&t=${Date.now()}`,
      { headers: { "User-Agent": "Mozilla/5.0" } },
    );
    return parsePlayStoreVersion(await res.text());
  } catch {
    return null;
  }
}

async function fetchIosStoreVersion(): Promise<string | null> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/kr/lookup?id=${IOS_APP_ID}&t=${Date.now()}`,
    );
    const json = (await res.json()) as { results?: { version?: string }[] };
    const version = json.results?.[0]?.version;
    return typeof version === "string" && version.trim() ? version.trim() : null;
  } catch {
    return null;
  }
}

let promptedThisLaunch = false;

/** 앱 실행 시 스토어에 더 높은 버전이 있으면 업데이트 창을 띄운다. */
export async function promptStoreUpdateOnLaunch(): Promise<void> {
  if (promptedThisLaunch) {
    return;
  }
  if (!isGoscaStoreBinary()) {
    return;
  }
  const installed = String(Constants.expoConfig?.version ?? "").trim();
  if (!installed) {
    return;
  }
  const storeVersion =
    Platform.OS === "ios"
      ? await fetchIosStoreVersion()
      : await fetchAndroidStoreVersion();
  if (!storeVersion || !isVersionNewer(storeVersion, installed)) {
    return;
  }
  promptedThisLaunch = true;
  Alert.alert(
    "업데이트 후 이용 가능합니다",
    "앱을 업데이트하면 이어서 이용할 수 있습니다.",
    [
      { text: "나중에", style: "cancel" },
      { text: "업데이트", onPress: () => openNativeStore() },
    ],
    { cancelable: true },
  );
}
