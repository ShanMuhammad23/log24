import { useMemo, useRef, useState } from 'react';
import { useColorScheme } from '@/components/useColorScheme';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { MIST, SUB } from '@/constants/Colors';
import { filterOrganizationOptions } from '@/utils/profile';

type OrganizationAutocompleteFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function OrganizationAutocompleteField({
  label,
  value,
  onChange,
  placeholder = 'Search airline, GA, or flight school',
}: OrganizationAutocompleteFieldProps) {
  const isDark = useColorScheme() === 'dark';
  const [focused, setFocused] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = useMemo(() => filterOrganizationOptions(value), [value]);
  const showDropdown = focused && suggestions.length > 0;
  const showEmptyHint = focused && value.trim().length > 0 && suggestions.length === 0;

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setFocused(true);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => setFocused(false), 200);
  };

  const selectOption = (optionLabel: string) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    onChange(optionLabel);
    setFocused(false);
  };

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium text-sub dark:text-mist">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={isDark ? MIST : SUB}
        autoCorrect={false}
        autoCapitalize="words"
        className="rounded-lg border border-rule bg-white px-4 py-3 text-base text-ink dark:border-ruleDark dark:bg-panel dark:text-white"
      />

      {showDropdown ? (
        <View className="mt-1 max-h-52 overflow-hidden rounded-lg border border-rule bg-white dark:border-ruleDark dark:bg-panel">
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {suggestions.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => selectOption(option.label)}
                className="border-b border-rule px-4 py-3 active:bg-paper dark:border-ruleDark dark:active:bg-night">
                <Text className="text-base text-ink dark:text-white">{option.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {showEmptyHint ? (
        <Text className="mt-2 text-xs text-sub dark:text-mist">No matching organizations. You can still save a custom name.</Text>
      ) : null}
    </View>
  );
}
