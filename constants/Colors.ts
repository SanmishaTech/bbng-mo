/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Auth & Dashboard colors
    primary: '#007AFF',
    primaryDark: '#0056CC',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    card: '#F2F2F7',
    border: '#E5E5EA',
    placeholder: '#8E8E93',
    surface: '#FFFFFF',
    surfaceSecondary: '#F8F9FA',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Auth & Dashboard colors
    primary: '#0A84FF',
    primaryDark: '#0056CC',
    secondary: '#5E5CE6',
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    card: '#1C1C1E',
    border: '#38383A',
    placeholder: '#8E8E93',
    surface: '#2C2C2E',
    surfaceSecondary: '#1C1C1E',
  },
};
