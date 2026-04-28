import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, Text, View, useColorScheme } from 'react-native';

type HomeHeaderProps = {
  pilotName: string;
  subtitle: string;
};

export function HomeHeader({ pilotName, subtitle }: HomeHeaderProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View className="px-5 pb-3 pt-3">
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-base text-slate-600 dark:text-slate-400">Good Morning, Pilot ✈</Text>
          <Text className="mt-1 text-4xl font-bold text-slate-900 dark:text-slate-100">{pilotName}</Text>
          <View className="mt-2 self-start rounded-full bg-blue-100 px-3 py-1 dark:bg-blue-900/40">
            <Text className="text-sm font-semibold text-blue-700 dark:text-blue-300">{subtitle}</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <Pressable className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <FontAwesome name="bell-o" size={21} color={isDark ? '#cbd5e1' : '#1e293b'} />
          </Pressable>
          <Pressable className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <FontAwesome name="user-o" size={21} color={isDark ? '#cbd5e1' : '#1e293b'} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
