import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Colors } from "@/constants/Colors";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import { TamaguiProvider } from '@tamagui/core';
import config from '../tamagui.config';

function RootLayoutNav() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [hasInitialized, setHasInitialized] = React.useState(false);

  useEffect(() => {
    // Only proceed with navigation logic after initial loading is complete
    if (isLoading) return;

    // Mark as initialized after first load
    if (!hasInitialized) {
      setHasInitialized(true);

      // Initial route handling
      if (segments.length === 0) {
        if (isAuthenticated) {
          router.replace("/(tabs)/");
        } else {
          router.replace("/login");
        }
      }
      return;
    }

    const inTabsGroup = segments[0] === "(tabs)";
    const onLoginPage = segments[0] === "login";

    // Only redirect on meaningful auth state changes
    // Never redirect when already on login page unless actually authenticated
    if (!isAuthenticated && inTabsGroup) {
      router.replace("/login");
    } else if (isAuthenticated && onLoginPage && user) {
      router.replace("/(tabs)/");
    }
  }, [isAuthenticated, isLoading, hasInitialized]); // Remove 'user' dependency to prevent extra re-renders

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modules" options={{ headerShown: false }} />
        <Stack.Screen name="references" options={{ headerShown: false }} />
        <Stack.Screen name="done-deals" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <Toast />
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <RootLayoutNav />
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
