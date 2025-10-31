import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface NavigationHeaderProps {
  title: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  onBackPress?: () => void;
  backPath?: string; // Explicit path to navigate back to
}

export function NavigationHeader({
  title,
  showBackButton = true,
  rightComponent,
  onBackPress,
  backPath,
}: NavigationHeaderProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (backPath) {
      // Use explicit back path if provided
      router.push(backPath as any);
    } else {
      // Default behavior: go back in navigation history
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor, borderBottomColor: colors.border },
      ]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={backgroundColor}
      />

      <View style={styles.content}>
        {/* Left Side - Back Button */}
        <View style={styles.leftContainer}>
          {showBackButton && (
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.surface }]}
              onPress={handleBackPress}
              activeOpacity={0.7}
            >
              <IconSymbol
                name="chevron.right"
                size={20}
                color={colors.primary}
                style={{ transform: [{ rotate: "180deg" }] }}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Center - Title */}
        <View style={styles.centerContainer}>
          <ThemedText
            style={[styles.title, { color: textColor }]}
            numberOfLines={1}
          >
            {title}
          </ThemedText>
        </View>

        {/* Right Side - Custom Component or Forward Button */}
        <View style={styles.rightContainer}>
          {rightComponent ? (
            rightComponent
          ) : (
            // <TouchableOpacity
            //   style={[styles.forwardButton, { backgroundColor: colors.surface }]}
            //   onPress={() => {
            //     if (router.canGoForward) {
            //       // Note: expo-router doesn't have built-in forward navigation
            //       // This is a placeholder for potential future functionality
            //     }
            //   }}
            //   activeOpacity={0.7}
            //   disabled={true} // Disabled for now as expo-router doesn't support forward navigation
            // >
            //   <IconSymbol
            //     name="chevron.right"
            //     size={20}
            //     color={colors.icon}
            //     style={{ opacity: 0.3 }}
            //   />
            // </TouchableOpacity>
            <></>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 24,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  leftContainer: {
    minWidth: 80,
    alignItems: "flex-start",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rightContainer: {
    minWidth: 80,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  forwardButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 8,
  },
});
