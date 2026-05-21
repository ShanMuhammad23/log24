import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { filterPresetOptions } from '@/utils/flight-field-presets';

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
  const [focused, setFocused] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalQuery, setModalQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inlineSuggestions = useMemo(() => filterPresetOptions(options, value), [options, value]);
  const modalSuggestions = useMemo(() => filterPresetOptions(options, modalQuery), [options, modalQuery]);

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
    !options.some((o) => o.toLowerCase() === addCandidate.toLowerCase());

  return (
    <View>
      <View className="flex-row items-center gap-2">
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-white"
        />
        <Pressable
          onPress={openModal}
          accessibilityLabel="Open saved options"
          className="h-12 w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 active:bg-slate-700">
          <FontAwesome name="list" size={16} color="#94a3b8" />
        </Pressable>
      </View>

      {showInlineDropdown ? (
        <View className="mt-1 max-h-40 overflow-hidden rounded-xl border border-slate-600 bg-slate-900">
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {inlineSuggestions.map((option) => (
              <Pressable
                key={option}
                onPress={() => selectOption(option)}
                className="border-b border-slate-800 px-4 py-3 active:bg-slate-800">
                <Text className="text-base text-slate-100">{option}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="max-h-[75%] rounded-t-2xl bg-slate-900 px-4 pb-6 pt-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-white">Saved options</Text>
              <Pressable onPress={() => setModalOpen(false)}>
                <Text className="text-sm font-semibold text-blue-400">Close</Text>
              </Pressable>
            </View>

            <TextInput
              value={modalQuery}
              onChangeText={setModalQuery}
              placeholder="Search..."
              placeholderTextColor="#64748b"
              autoCapitalize={autoCapitalize}
              autoCorrect={false}
              className="mb-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white"
            />

            {canAddInModal ? (
              <Pressable
                onPress={() => addNewValue(addCandidate)}
                disabled={adding}
                className="mb-3 flex-row items-center justify-center gap-2 rounded-xl border border-blue-800 bg-blue-950/50 py-3 active:bg-blue-900/40 disabled:opacity-60">
                {adding ? <ActivityIndicator color="#60a5fa" size="small" /> : <FontAwesome name="plus" size={14} color="#60a5fa" />}
                <Text className="text-sm font-semibold text-blue-300">Add new: {addCandidate}</Text>
              </Pressable>
            ) : null}

            {addError ? <Text className="mb-2 text-sm text-red-400">{addError}</Text> : null}

            <ScrollView keyboardShouldPersistTaps="handled">
              {modalSuggestions.length === 0 ? (
                <Text className="py-6 text-center text-sm text-slate-500">
                  {options.length === 0 ? 'No saved values yet. Use Add new above.' : 'No matches. Use Add new to save this value.'}
                </Text>
              ) : (
                modalSuggestions.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => selectOption(option)}
                    className="flex-row items-center justify-between border-b border-slate-800 py-4">
                    <Text className="text-base text-slate-100">{option}</Text>
                    {option.toLowerCase() === value.trim().toLowerCase() ? (
                      <FontAwesome name="check" size={14} color="#60a5fa" />
                    ) : null}
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
