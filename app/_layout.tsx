import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useNotificationManager } from "@/hooks/useNotificationManager";
import SyncChoiceModal from "@/components/SyncChoiceModal";
import CustomSplashScreen from "../components/splash";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "@/constants/languages";

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { language } = useApp();
  const t = useTranslation(language);

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="devices" options={{ title: t.manageDevices, headerBackTitle: t.settings }} />
      <Stack.Screen name="profile" options={{ title: t.editProfile, headerBackTitle: t.settings }} />
      <Stack.Screen name="notification-settings" options={{ title: t.notifications, headerBackTitle: t.settings }} />
      <Stack.Screen name="energy-providers" options={{ title: t.energyProviders, headerBackTitle: t.settings }} />
      <Stack.Screen name="sustainability-settings" options={{ title: t.sustainability, headerBackTitle: t.settings }} />
      <Stack.Screen name="support" options={{ title: t.helpSupport, headerBackTitle: t.settings }} />
      <Stack.Screen name="privacy" options={{ title: t.privacy, headerBackTitle: t.settings }} />
    </Stack>
  );
}

function AppContent() {
  const [isBetaChecked, setIsBetaChecked] = useState(false);

  useNotificationManager();

  if (!isBetaChecked) {
    return <CustomSplashScreen onContinue={() => setIsBetaChecked(true)} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <RootLayoutNav />
        <SyncChoiceModal />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </AppProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
