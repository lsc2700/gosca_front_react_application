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

/** 웹이 보낸 스토어 주소 중 이 앱의 스토어 페이지만 허용한다. 다른 앱·사이트로는 보내지 않는다. */
export function isTrustedStoreUrl(url: unknown): url is string {
  if (typeof url !== "string" || !url.trim()) return false;
  const value = url.trim();
  if (Platform.OS === "ios") {
    return (
      (/^itms-apps:\/\/(apps|itunes)\.apple\.com\//i.test(value) ||
        /^https:\/\/apps\.apple\.com\//i.test(value)) &&
      value.includes(`id${IOS_APP_ID}`)
    );
  }
  const pkg = Constants.expoConfig?.android?.package ?? GOSCA_ANDROID_PACKAGE;
  return (
    (/^market:\/\/details\?/i.test(value) ||
      /^https:\/\/play\.google\.com\/store\/apps\/details\?/i.test(value)) &&
    value.includes(`id=${pkg}`)
  );
}

/**
 * 웹뷰의 GOSCA_OPEN_STORE 처리. 웹이 별점 작성 같은 더 정확한 주소를 보내면 그 주소로,
 * 아니면 기본 스토어 페이지로 연다. 첫 주소가 실패하면 보조 주소를 쓴다.
 */
export async function openStoreFromWeb(payload: {
  url?: unknown;
  fallbackUrl?: unknown;
}): Promise<void> {
  const candidates = [payload.url, payload.fallbackUrl].filter(isTrustedStoreUrl);
  candidates.push(nativeStoreUrl());
  for (const candidate of candidates) {
    try {
      await Linking.openURL(candidate);
      return;
    } catch {
      /* 다음 주소로 */
    }
  }
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
