/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fdfdfd",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#64748B", // Design system: text_quaternary
    tabIconSelected: "#8B5CF6", // Design system: primary purple
    // Auth & Dashboard colors
    primary: "#8B5CF6", // Design system: primary purple
    primaryDark: "#7C3AED", // Design system: gradient end
    secondary: "#5856D6",
    success: "#10B981", // Design system: success green
    warning: "#F59E0B", // Design system: warning amber
    error: "#EF4444", // Design system: error red
    info: "#06B6D4", // Design system: info cyan
    card: "#FFFFFF",
    border: "#E5E5EA",
    placeholder: "#8E8E93",
    surface: "#FFFFFF",
    surfaceSecondary: "#F8F9FA",
    // Design system text colors
    textPrimary: "#11181C",
    textSecondary: "#64748B",
    textTertiary: "#94A3B8",
    textQuaternary: "#CBD5E1",
  },
  dark: {
    text: "#FFFFFF", // Design system: text_primary
    background: "#0F172A", // Design system: bg_primary
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#64748B", // Design system: text_quaternary
    tabIconSelected: "#8B5CF6", // Design system: primary purple
    // Auth & Dashboard colors
    primary: "#8B5CF6", // Design system: primary purple
    primaryDark: "#7C3AED", // Design system: gradient end
    secondary: "#5E5CE6",
    success: "#10B981", // Design system: success green
    warning: "#F59E0B", // Design system: warning amber
    error: "#EF4444", // Design system: error red
    info: "#06B6D4", // Design system: info cyan
    card: "#1E293B", // Design system: bg_secondary
    border: "rgba(255, 255, 255, 0.05)", // Design system: border subtle
    placeholder: "#64748B",
    surface: "#1E293B",
    surfaceSecondary: "#334155", // Design system: bg_tertiary
    // Design system text colors
    textPrimary: "#FFFFFF",
    textSecondary: "#CBD5E1",
    textTertiary: "#94A3B8",
    textQuaternary: "#64748B",
  },
};
