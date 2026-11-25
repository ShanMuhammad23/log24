import { Pressable, Text, View } from 'react-native';

type SectionHeaderProps = {
  title: string;
  actionLabel: string;
  onActionPress?: () => void;
};

export function SectionHeader({ title, actionLabel, onActionPress }: SectionHeaderProps) {
  return (
    <View className="mb-3 mt-6 flex-row items-center justify-between px-5">
      <Text className="text-lg font-bold text-ink dark:text-white">{title}</Text>
      <Pressable onPress={onActionPress} className="active:opacity-70">
        <Text className="text-sm font-semibold text-arcDeep dark:text-arc">{actionLabel}</Text>
      </Pressable>
    </View>
  );
}
