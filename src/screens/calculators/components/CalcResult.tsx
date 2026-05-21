import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CalculatorColors, useCalculatorTheme } from '../theme';

export interface CalcResultProps {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
}

const CalcResult: React.FC<CalcResultProps> = ({ label, value, unit, highlight = false }) => {
  const { colors } = useCalculatorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.wrap, highlight ? styles.wrapHighlight : null]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, highlight ? styles.valueHighlight : null]}>
        {value}
        {unit ? <Text style={styles.unit}> {unit}</Text> : null}
      </Text>
    </View>
  );
};

function createStyles(colors: CalculatorColors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    wrapHighlight: {
      backgroundColor: colors.accent + '14',
      marginHorizontal: -8,
      paddingHorizontal: 8,
      borderRadius: 8,
      borderBottomWidth: 0,
      marginBottom: 4,
    },
    label: {
      color: colors.muted,
      fontSize: 14,
      flex: 1,
    },
    value: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    valueHighlight: {
      color: colors.accent,
      fontSize: 18,
    },
    unit: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: '500',
    },
  });
}

export default CalcResult;
