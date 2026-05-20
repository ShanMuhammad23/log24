import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme, useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = '@log24/theme-preference';

export type ThemePreference = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedScheme: 'light' | 'dark';
  setPreference: (pref: ThemePreference) => Promise<void>;
  cyclePreference: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme: resolved } = useNativeWindColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    const load = async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const pref = isThemePreference(saved) ? saved : 'system';
      setPreferenceState(pref);
      colorScheme.setColorScheme(pref);
    };
    load();
  }, []);

  const setPreference = useCallback(async (pref: ThemePreference) => {
    setPreferenceState(pref);
    colorScheme.setColorScheme(pref);
    await AsyncStorage.setItem(STORAGE_KEY, pref);
  }, []);

  const cyclePreference = useCallback(async () => {
    const next: ThemePreference =
      preference === 'system' ? 'light' : preference === 'light' ? 'dark' : 'system';
    await setPreference(next);
  }, [preference, setPreference]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolvedScheme: resolved === 'dark' ? 'dark' : 'light',
      setPreference,
      cyclePreference,
    }),
    [preference, resolved, setPreference, cyclePreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return context;
}

export function themePreferenceLabel(preference: ThemePreference) {
  if (preference === 'dark') return 'Dark';
  if (preference === 'light') return 'Light';
  return 'System default';
}
