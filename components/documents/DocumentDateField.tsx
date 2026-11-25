import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { MIST, SUB } from '@/constants/Colors';
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
  const isDark = useColorScheme() === 'dark';
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
        <Text className="mb-2 text-sm font-medium text-sub dark:text-mist">{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={isDark ? MIST : SUB}
          autoCapitalize="none"
          className="rounded-lg border border-rule bg-white px-4 py-3 text-base text-ink dark:border-ruleDark dark:bg-panel dark:text-white"
        />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Text className="mb-2 text-sm font-medium text-sub dark:text-mist">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-lg border border-rule bg-white px-4 py-3 dark:border-ruleDark dark:bg-panel">
        <Text className={value ? 'text-ink dark:text-white' : 'text-sub dark:text-mist'}>
          {value || 'YYYY-MM-DD'}
        </Text>
        <FontAwesome name="calendar" size={15} color={isDark ? MIST : SUB} />
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
            <View className="rounded-t-xl border-t border-rule bg-white px-4 pb-8 pt-3 dark:border-ruleDark dark:bg-panel">
              <View className="mb-3 flex-row items-center justify-between">
                <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                  <Text className="text-base font-medium text-sub dark:text-mist">Cancel</Text>
                </Pressable>
                <Text className="text-base font-semibold text-ink dark:text-white">{label}</Text>
                <Pressable onPress={() => confirm(draft)} hitSlop={8}>
                  <Text className="text-base font-semibold text-arcDeep dark:text-arc">Done</Text>
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
