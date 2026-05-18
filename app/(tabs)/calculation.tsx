import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CalculationScreen() {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-950">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl font-bold text-white">Calculation</Text>
        <Text className="mt-2 text-center text-base text-slate-400">Content coming soon</Text>
      </View>
    </SafeAreaView>
  );
}
