import { useAppTheme } from '@/contexts/ThemeProvider';

export function useColorScheme(): 'light' | 'dark' {
  return useAppTheme().resolvedScheme;
}
