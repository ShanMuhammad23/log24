import { Text, View } from '@/components/Themed';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-950">
      <Text className="text-3xl font-extrabold text-zinc-950 dark:text-zinc-50">
        Home
      </Text>
    </View>
  );
}
