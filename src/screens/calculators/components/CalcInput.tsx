import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme';

export interface CalcInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  unit?: string;
  placeholder?: string;
  error?: string;
  keyboardType?: 'numeric' | 'default';
}

const CalcInput: React.FC<CalcInputProps> = ({
  label,
  value,
  onChangeText,
  unit,
  placeholder,
  error,
  keyboardType = 'numeric',
}) => {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={keyboardType}
        />
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 16,
  },
  inputError: {
    borderColor: colors.error,
  },
  unit: {
    marginLeft: 10,
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    minWidth: 36,
  },
  error: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default CalcInput;
