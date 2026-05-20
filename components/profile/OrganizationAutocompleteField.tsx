import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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
      <Text className="mb-2 text-sm font-semibold text-slate-300">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor="#64748b"
        autoCorrect={false}
        autoCapitalize="words"
        className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-white"
      />

      {showDropdown ? (
        <View className="mt-1 max-h-52 overflow-hidden rounded-xl border border-slate-600 bg-slate-900">
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {suggestions.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => selectOption(option.label)}
                className="border-b border-slate-800 px-4 py-3 active:bg-slate-800">
                <Text className="text-base text-slate-100">{option.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {showEmptyHint ? (
        <Text className="mt-2 text-xs text-slate-500">No matching organizations. You can still save a custom name.</Text>
      ) : null}
    </View>
  );
}
