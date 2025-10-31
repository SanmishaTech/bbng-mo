import { useTheme } from '@/contexts/ThemeContext';

/**
 * Custom hook that wraps the ThemeContext and returns the active color scheme
 * This hook integrates with the theme preference system (system/light/dark)
 * and ensures it always returns a valid value (never null)
 */
export function useColorScheme() {
  try {
    const { activeTheme } = useTheme();
    return activeTheme;
  } catch (error) {
    // Fallback for components not wrapped in ThemeProvider
    // This shouldn't happen in production but provides safety
    console.warn('useColorScheme called outside ThemeProvider, defaulting to light');
    return 'light' as const;
  }
}
