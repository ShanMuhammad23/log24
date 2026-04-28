import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, Text, View } from 'react-native';

type HomeHeaderProps = {
  pilotName: string;
  subtitle: string;
};

export function HomeHeader({ pilotName, subtitle }: HomeHeaderProps) {
  return (
    <View className="px-5 pb-3 pt-3">
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-base text-slate-600">Good Morning, Pilot ✈</Text>
          <Text className="mt-1 text-4xl font-bold text-slate-900">{pilotName}</Text>
          <View className="mt-2 self-start rounded-full bg-blue-100 px-3 py-1">
            <Text className="text-sm font-semibold text-blue-700">{subtitle}</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <Pressable className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white">
            <FontAwesome name="bell-o" size={21} color="#1e293b" />
          </Pressable>
          <Pressable className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white">
            <FontAwesome name="user-o" size={21} color="#1e293b" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
