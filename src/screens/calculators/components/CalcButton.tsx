import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { type CalculatorColors, useCalculatorTheme } from '../theme';

export interface CalcButtonProps {
  onPress: () => void;
  title?: string;
}

const CalcButton: React.FC<CalcButtonProps> = ({ onPress, title = 'Calculate' }) => {
  const { colors } = useCalculatorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

function createStyles(colors: CalculatorColors) {
  return StyleSheet.create({
    btn: {
      backgroundColor: colors.accent,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 16,
    },
    text: {
      color: colors.onAccent,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}

export default CalcButton;
