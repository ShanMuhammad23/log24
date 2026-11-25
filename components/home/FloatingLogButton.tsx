import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export function FloatingLogButton() {
  const router = useRouter();

  return (
    <View className="absolute bottom-4 right-4 items-center">
      <Pressable
        onPress={() => router.push('/add-flight')}
        className="h-14 w-14 items-center justify-center rounded-full bg-arc">
        <FontAwesome name="plus" size={24} color="#0A1428" />
      </Pressable>
      <Text className="mt-1.5 text-xs font-semibold text-arcDeep dark:text-arc">Log flight</Text>
    </View>
  );
}
