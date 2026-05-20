import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName, View } from 'react-native';

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

function resolveScheme(preference: ThemePreference, systemScheme: ColorSchemeName): 'light' | 'dark' {
  if (preference === 'dark') return 'dark';
  if (preference === 'light') return 'light';
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme() ?? 'light');

  const resolvedScheme = resolveScheme(preference, systemScheme);

  useEffect(() => {
    const load = async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const pref = isThemePreference(saved) ? saved : 'system';
      setPreferenceState(pref);
    };
    load();
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme ?? 'light');
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // null = follow OS when preference is "system"
    Appearance.setColorScheme(preference === 'system' ? null : preference);
  }, [preference]);

  const setPreference = useCallback(async (pref: ThemePreference) => {
    setPreferenceState(pref);
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
      resolvedScheme,
      setPreference,
      cyclePreference,
    }),
    [preference, resolvedScheme, setPreference, cyclePreference]
  );

  return (
    <ThemeContext.Provider value={value}>
      <View className={`flex-1 ${resolvedScheme === 'dark' ? 'dark' : ''}`}>{children}</View>
    </ThemeContext.Provider>
  );
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
