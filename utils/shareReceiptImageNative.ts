import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

/**
 * WebView에서 받은 base64 JPEG → 캐시 파일 생성 후
 * 1) 사진 라이브러리에 직접 저장 (권한 허용 시)
 * 2) 실패·거부 시 공유 시트로 대체
 */
export async function shareReceiptImageFromWebPayload(
  base64: string,
  filename: string,
): Promise<void> {
  const cleaned = base64.replace(/^data:image\/\w+;base64,/, "").trim();
  if (cleaned.length < 20) {
    Alert.alert("오류", "이미지 데이터가 올바르지 않습니다.");
    return;
  }
  const safeName =
    typeof filename === "string" && /^[a-zA-Z0-9_.-]+\.jpe?g$/i.test(filename)
      ? filename
      : `receipt_${Date.now()}.jpg`;

  const dir = FileSystem.cacheDirectory;
  if (!dir) {
    Alert.alert("오류", "저장 공간을 사용할 수 없습니다.");
    return;
  }

  const fileUri = `${dir}${safeName}`;
  await FileSystem.writeAsStringAsync(fileUri, cleaned, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const available = await MediaLibrary.isAvailableAsync();
  if (available) {
    try {
      const perm = await MediaLibrary.requestPermissionsAsync(true);
      if (perm.granted) {
        await MediaLibrary.saveToLibraryAsync(fileUri);
        Alert.alert("저장 완료", "사진(갤러리) 앱에서 영수증을 확인할 수 있습니다.");
        return;
      }
    } catch (e) {
      console.warn("MediaLibrary save failed, fallback to share", e);
    }
  }

  if (!(await Sharing.isAvailableAsync())) {
    Alert.alert(
      "알림",
      "갤러리에 바로 저장할 수 없습니다. 설정에서 사진 저장 권한을 허용한 뒤 다시 시도해 주세요.",
    );
    return;
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: "image/jpeg",
    dialogTitle: "영수증 공유·저장",
  });
}
