import * as Location from "expo-location";
import { Platform } from "react-native";

export type NativeLocationPayload = {
  type: "GOSCA_LOCATION";
  platform: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number | null;
  error?: { code: number; message: string };
};

/**
 * 웹 「내주변」 탭(getLocation)에서만 호출한다. 앱 시작 시 호출하지 않는다.
 */
export async function fetchLocationForNearMe(): Promise<NativeLocationPayload> {
  const base: NativeLocationPayload = {
    type: "GOSCA_LOCATION",
    platform: Platform.OS,
    latitude: null,
    longitude: null,
    accuracy: null,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    timestamp: null,
  };

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return {
        ...base,
        error: { code: 1, message: "Permission to access location was denied" },
      };
    }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      ...base,
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      altitude: pos.coords.altitude,
      altitudeAccuracy: pos.coords.altitudeAccuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
      timestamp: pos.timestamp,
    };
  } catch {
    return {
      ...base,
      error: { code: 2, message: "Failed to get current position" },
    };
  }
}
