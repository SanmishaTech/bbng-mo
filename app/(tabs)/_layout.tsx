import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  // Debug: Log when TabLayout re-renders
  React.useEffect(() => {
    console.log('[TabLayout] Color scheme updated:', colorScheme);
  }, [colorScheme]);

  return (
    <Tabs
      key={colorScheme}
      screenOptions={{
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          ...Platform.select({
            ios: {
              position: "absolute",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: colorScheme === 'dark' ? 0.15 : 0.1,
              shadowRadius: 8,
            },
            android: {
              elevation: 16,
            },
            default: {},
          }),
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          // Dynamic height accounting for safe area
          height: Platform.OS === "ios" ? 82 : 60 + insets.bottom,
          // Proper padding with safe area insets
          paddingBottom: Platform.OS === "ios" ? 20 : 0,
          paddingTop: 6,
          paddingHorizontal: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.5,
          textTransform: "uppercase",
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={24}
              name="house.fill"
              color={color}
              style={{
                opacity: focused ? 1 : 0.7,
                transform: [{ scale: focused ? 1.08 : 1 }],
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="_modules"
        options={{
          title: "Modules",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={24}
              name="square.grid.2x2.fill"
              color={color}
              style={{
                opacity: focused ? 1 : 0.7,
                transform: [{ scale: focused ? 1.08 : 1 }],
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: "Members",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={24}
              name="person.2.fill"
              color={color}
              style={{
                opacity: focused ? 1 : 0.7,
                transform: [{ scale: focused ? 1.08 : 1 }],
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={24}
              name="person.circle.fill"
              color={color}
              style={{
                opacity: focused ? 1 : 0.7,
                transform: [{ scale: focused ? 1.08 : 1 }],
              }}
            />
          ),
        }}
      />

      {/* Hidden tabs - still accessible via navigation but not shown in tab bar */}
      <Tabs.Screen
        name="performance"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="references"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
