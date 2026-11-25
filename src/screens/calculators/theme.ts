import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useAppTheme } from '@/contexts/ThemeProvider';
import {
  ARC,
  ARC_DEEP,
  INK,
  MIST,
  NIGHT,
  PANEL,
  PAPER,
  RULE,
  RULE_DARK,
  SUB,
} from '@/constants/Colors';

export type CalculatorColors = {
  bg: string;
  card: string;
  accent: string;
  accentText: string;
  text: string;
  muted: string;
  error: string;
  success: string;
  danger: string;
  border: string;
  onAccent: string;
};

const light: CalculatorColors = {
  bg: PAPER,
  card: '#ffffff',
  accent: ARC,
  accentText: ARC_DEEP,
  text: INK,
  muted: SUB,
  error: '#dc2626',
  success: '#059669',
  danger: '#dc2626',
  border: RULE,
  onAccent: NIGHT,
};

const dark: CalculatorColors = {
  bg: NIGHT,
  card: PANEL,
  accent: ARC,
  accentText: ARC,
  text: '#ffffff',
  muted: MIST,
  error: '#f87171',
  success: '#34d399',
  danger: '#f87171',
  border: RULE_DARK,
  onAccent: NIGHT,
};

export function getCalculatorColors(scheme: 'light' | 'dark'): CalculatorColors {
  return scheme === 'dark' ? dark : light;
}

export function createCalculatorSharedStyles(colors: CalculatorColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      gap: 12,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    backBtnText: {
      color: colors.text,
      fontSize: 22,
      lineHeight: 24,
    },
    title: {
      flex: 1,
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.accentText,
      marginBottom: 12,
    },
    row: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
    },
    segmentRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    segment: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 6,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segmentActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    segmentText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '600',
    },
    segmentTextActive: {
      color: colors.onAccent,
    },
    description: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 8,
    },
  });
}

export function useCalculatorTheme() {
  const { resolvedScheme } = useAppTheme();
  const colors = useMemo(() => getCalculatorColors(resolvedScheme), [resolvedScheme]);
  const styles = useMemo(() => createCalculatorSharedStyles(colors), [colors]);
  return { colors, styles, resolvedScheme };
}

/** @deprecated Use useCalculatorTheme() */
export const colors = dark;
