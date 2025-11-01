import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Ensures the web bundle waits for hydration before trusting the ThemeContext,
 * keeping server-rendered markup in sync with the first client render.
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  try {
    const { activeTheme } = useTheme();
    return hasHydrated ? activeTheme : 'light';
  } catch (error) {
    console.warn('useColorScheme (web) called outside ThemeProvider, defaulting to light');
    return 'light';
  }
}
