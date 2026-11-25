import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import { MIST, SUB } from '@/constants/Colors';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import { dedupePresetOptions, filterPresetOptions } from '@/utils/flight-field-presets';

type SearchablePresetFieldProps = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  onAddNew: (value: string) => Promise<{ error: string | null }>;
  autoCapitalize?: 'none' | 'characters' | 'words' | 'sentences';
};

export function SearchablePresetField({
  value,
  onChange,
  options,
  placeholder,
  onAddNew,
  autoCapitalize = 'none',
}: SearchablePresetFieldProps) {
  const isDark = useColorScheme() === 'dark';
  const [focused, setFocused] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalQuery, setModalQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const uniqueOptions = useMemo(() => dedupePresetOptions(options), [options]);
  const inlineSuggestions = useMemo(
    () => filterPresetOptions(uniqueOptions, value),
    [uniqueOptions, value]
  );
  const modalSuggestions = useMemo(
    () => filterPresetOptions(uniqueOptions, modalQuery),
    [uniqueOptions, modalQuery]
  );

  const showInlineDropdown = focused && inlineSuggestions.length > 0;

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

  const selectOption = (option: string) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    onChange(option);
    setFocused(false);
    setModalOpen(false);
    setModalQuery('');
    setAddError(null);
  };

  const openModal = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setFocused(false);
    setModalQuery(value);
    setAddError(null);
    setModalOpen(true);
  };

  const addNewValue = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setAddError('Enter a value to add.');
      return;
    }

    setAdding(true);
    setAddError(null);
    const { error } = await onAddNew(trimmed);
    setAdding(false);

    if (error) {
      setAddError(error);
      return;
    }

    selectOption(trimmed);
  };

  const addCandidate = (modalQuery || value).trim();
  const canAddInModal =
    addCandidate.length > 0 &&
    !uniqueOptions.some((o) => o.toLowerCase() === addCandidate.toLowerCase());

  return (
    <View>
      <View className="flex-row items-center gap-2">
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={isDark ? MIST : SUB}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          className="flex-1 rounded-lg border border-rule bg-white px-4 py-3 text-base text-ink dark:border-ruleDark dark:bg-panel dark:text-white"
        />
        <Pressable
          onPress={openModal}
          accessibilityLabel="Open saved options"
          className="h-12 w-12 items-center justify-center rounded-lg border border-rule bg-paper active:bg-rule dark:border-ruleDark dark:bg-panel dark:active:bg-panel">
          <FontAwesome name="list" size={16} color={isDark ? MIST : SUB} />
        </Pressable>
      </View>

      {showInlineDropdown ? (
        <View className="mt-1 max-h-40 overflow-hidden rounded-lg border border-rule bg-white dark:border-ruleDark dark:bg-panel">
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {inlineSuggestions.map((option, index) => (
              <Pressable
                key={`${option}-${index}`}
                onPress={() => selectOption(option)}
                className="border-b border-rule px-4 py-3 active:bg-paper dark:border-ruleDark dark:active:bg-panel">
                <Text className="text-base text-ink dark:text-white">{option}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <BottomSheetModal visible={modalOpen} onClose={() => setModalOpen(false)}>
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-ink dark:text-white">Saved options</Text>
          <Pressable onPress={() => setModalOpen(false)}>
            <Text className="text-sm font-semibold text-arc">Close</Text>
          </Pressable>
        </View>

        <TextInput
          value={modalQuery}
          onChangeText={setModalQuery}
          placeholder="Search..."
          placeholderTextColor={isDark ? MIST : SUB}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          className="mb-3 rounded-lg border border-rule bg-white px-4 py-3 text-base text-ink dark:border-ruleDark dark:bg-night dark:text-white"
        />

        {canAddInModal ? (
          <Pressable
            onPress={() => addNewValue(addCandidate)}
            disabled={adding}
            className="mb-3 flex-row items-center justify-center gap-2 rounded-lg border border-arc/40 bg-arc/10 py-3 active:bg-arc/10 disabled:opacity-60 dark:border-arc/40 dark:bg-arc/10 dark:active:bg-arc/20">
            {adding ? <ActivityIndicator color="#2EA8FF" size="small" /> : <FontAwesome name="plus" size={14} color="#2EA8FF" />}
            <Text className="text-sm font-semibold text-arcDeep dark:text-arc">Add new: {addCandidate}</Text>
          </Pressable>
        ) : null}

        {addError ? <Text className="mb-2 text-sm text-red-400">{addError}</Text> : null}

        <ScrollView keyboardShouldPersistTaps="handled">
          {modalSuggestions.length === 0 ? (
            <Text className="py-6 text-center text-sm text-sub dark:text-mist">
              {uniqueOptions.length === 0 ? 'No saved values yet. Use Add new above.' : 'No matches. Use Add new to save this value.'}
            </Text>
          ) : (
            modalSuggestions.map((option, index) => (
              <Pressable
                key={`${option}-${index}`}
                onPress={() => selectOption(option)}
                className="flex-row items-center justify-between border-b border-rule py-4 dark:border-ruleDark">
                <Text className="text-base text-ink dark:text-white">{option}</Text>
                {option.toLowerCase() === value.trim().toLowerCase() ? (
                  <FontAwesome name="check" size={14} color="#2EA8FF" />
                ) : null}
              </Pressable>
            ))
          )}
        </ScrollView>
      </BottomSheetModal>
    </View>
  );
}
