import { registerRootComponent } from "expo";
import * as SplashScreen from "expo-splash-screen";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import App from "./App";

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

registerRootComponent(Root);
