import { registerRootComponent } from "expo";
import messaging from "@react-native-firebase/messaging";
import * as SplashScreen from "expo-splash-screen";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import App from "./App";
import { displayGroupedAndroidNotification } from "./utils/groupedNotifications";

function Root() {
  SplashScreen.setOptions({
    duration: 1000,
    fade: true,
  });

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <App />
    </SafeAreaProvider>
  );
}

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  await displayGroupedAndroidNotification(remoteMessage);
});

registerRootComponent(Root);
