import "../global.css";
import { ReactNode, useCallback, useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useSessionStore } from "../src/store/session";
import { APP_FONTS, FONT_SANS } from "../src/lib/fonts";

SplashScreen.preventAutoHideAsync().catch(() => {});

// Editorial minimal type system: Inter is the default body/UI font
// everywhere unless a component explicitly opts into the Fraunces serif for
// headlines/names/scores. Patching Text.defaultProps is the standard RN
// pattern for a sitewide default — avoids touching every screen.
// @ts-expect-error - defaultProps isn't in RN's Text type, but it's read at render time.
Text.defaultProps = Text.defaultProps ?? {};
// @ts-expect-error - see above.
Text.defaultProps.style = [{ fontFamily: FONT_SANS }, Text.defaultProps.style];

function AuthGate({ children }: { children: ReactNode }) {
  const initializing = useSessionStore((s) => s.initializing);
  const isSignedIn = useSessionStore((s) => s.isSignedIn);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    const inAuthGroup = segments[0] === "auth";
    if (!isSignedIn && !inAuthGroup) {
      router.replace("/auth");
    } else if (isSignedIn && inAuthGroup) {
      router.replace("/(tabs)/feed");
    }
  }, [initializing, isSignedIn, segments, router]);

  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(APP_FONTS);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <StatusBar style="dark" />
      <AuthGate>
        <Stack screenOptions={{ headerStyle: { backgroundColor: "#FFF8F0" }, headerTintColor: "#3D2B1F" }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="cafe/[id]" options={{ title: "Cafe" }} />
          <Stack.Screen name="user/[id]" options={{ title: "Profile" }} />
          <Stack.Screen name="user/friends" options={{ title: "Friends" }} />
          <Stack.Screen name="log/[cafeId]" options={{ title: "Log a Visit", presentation: "modal" }} />
          <Stack.Screen name="auth/index" options={{ title: "Sign In", headerShown: false }} />
        </Stack>
      </AuthGate>
    </SafeAreaProvider>
  );
}
