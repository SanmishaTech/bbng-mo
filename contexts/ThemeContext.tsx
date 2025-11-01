import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';
type ActiveTheme = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  activeTheme: ActiveTheme;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isLoading: boolean;
  renderKey: number;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_theme_preference';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);
  const [renderKey, setRenderKey] = useState(0);

  // Determine the active theme based on mode and system preference
  const activeTheme: ActiveTheme = useMemo(() => {
    return themeMode === 'system' 
      ? (systemColorScheme ?? 'light') 
      : themeMode;
  }, [themeMode, systemColorScheme]);

  // Debug: Log theme changes
  useEffect(() => {
    console.log('Theme changed:', { themeMode, activeTheme, systemColorScheme });
  }, [themeMode, activeTheme, systemColorScheme]);

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      setRenderKey(prev => prev + 1); // Force re-render
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ themeMode, activeTheme, setThemeMode, isLoading, renderKey }),
    [themeMode, activeTheme, isLoading, renderKey]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
