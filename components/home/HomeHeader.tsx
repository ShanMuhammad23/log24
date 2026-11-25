import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import { Pressable, Text, View } from 'react-native';
import { INK, MIST } from '@/constants/Colors';

type HomeHeaderProps = {
  pilotName: string;
  subtitle: string;
  onMenuPress?: () => void;
};

const formatToday = () =>
  new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

export function HomeHeader({ pilotName, subtitle, onMenuPress }: HomeHeaderProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View className="px-5 pb-4 pt-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-sm text-sub dark:text-mist">{formatToday()}</Text>
          <Text className="mt-1 text-3xl font-bold text-ink dark:text-white">{pilotName}</Text>
          <Text className="mt-0.5 text-sm font-medium text-sub dark:text-mist">{subtitle}</Text>
        </View>

        <Pressable
          onPress={onMenuPress}
          className="h-10 w-10 items-center justify-center rounded-lg border border-rule bg-white dark:border-ruleDark dark:bg-panel">
          <FontAwesome name="bars" size={16} color={isDark ? MIST : INK} />
        </Pressable>
      </View>
    </View>
  );
}
