import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Custom hook that wraps React Native's useColorScheme
 * and ensures it always returns a valid value (never null)
 */
export function useColorScheme() {
  const colorScheme = useRNColorScheme();
  // Always return a valid color scheme, defaulting to 'light' if null
  return colorScheme ?? 'light';
}
