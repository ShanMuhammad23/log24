import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, Text, View } from 'react-native';

type SectionHeaderProps = {
  title: string;
  actionLabel: string;
};

export function SectionHeader({ title, actionLabel }: SectionHeaderProps) {
  return (
    <View className="mb-3 mt-4 flex-row items-center justify-between px-5">
      <Text className="text-3xl font-bold text-slate-900 dark:text-slate-100">{title}</Text>
      <Pressable className="flex-row items-center gap-1">
        <Text className="text-base font-semibold text-blue-700 dark:text-blue-400">{actionLabel}</Text>
        <FontAwesome name="angle-right" size={14} color="#1d4ed8" />
      </Pressable>
    </View>
  );
}
