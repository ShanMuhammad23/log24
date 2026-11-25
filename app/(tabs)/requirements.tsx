import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RequirementsScreen() {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-paper dark:bg-night">
      <View className="flex-1 px-5 pt-3">
        <Text className="text-2xl font-bold text-ink dark:text-white">Requirements</Text>
        <Text className="mt-1 text-sm text-sub dark:text-mist">
          Licensing requirements and hour minimums — coming soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}
