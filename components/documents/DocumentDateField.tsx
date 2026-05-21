import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { parseLocalDateOnly } from '@/utils/documents';

function formatDateISO(dateValue: Date) {
  const y = dateValue.getFullYear();
  const m = String(dateValue.getMonth() + 1).padStart(2, '0');
  const d = String(dateValue.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

type DocumentDateFieldProps = {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
};

export function DocumentDateField({ label, value, onChange }: DocumentDateFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => parseLocalDateOnly(value) ?? new Date());

  useEffect(() => {
    if (open) {
      setDraft(parseLocalDateOnly(value) ?? new Date());
    }
  }, [open, value]);

  const confirm = (date: Date) => {
    onChange(formatDateISO(date));
    setOpen(false);
  };

  const onAndroidChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setOpen(false);
    if (event.type === 'dismissed') return;
    if (event.type === 'set' && selectedDate) {
      onChange(formatDateISO(selectedDate));
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View className="flex-1">
        <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
        <Text className={value ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}>
          {value || 'YYYY-MM-DD'}
        </Text>
        <FontAwesome name="calendar" size={15} color="#64748b" />
      </Pressable>

      {Platform.OS === 'android' && open ? (
        <DateTimePicker
          value={draft}
          mode="date"
          display="default"
          onChange={onAndroidChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <View className="flex-1 justify-end bg-black/50">
            <View className="rounded-t-2xl bg-white px-4 pb-8 pt-3 dark:bg-slate-900">
              <View className="mb-3 flex-row items-center justify-between">
                <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                  <Text className="text-base font-medium text-slate-500 dark:text-slate-400">Cancel</Text>
                </Pressable>
                <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">{label}</Text>
                <Pressable onPress={() => confirm(draft)} hitSlop={8}>
                  <Text className="text-base font-semibold text-blue-600 dark:text-blue-400">Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={draft}
                mode="date"
                display="spinner"
                onChange={(_event, selectedDate) => {
                  if (selectedDate) setDraft(selectedDate);
                }}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}
