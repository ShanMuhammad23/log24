import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export function FloatingLogButton() {
  const router = useRouter();

  return (
    <View className="absolute bottom-24 right-4 items-center">
      <Pressable
        onPress={() => router.push('/add-flight')}
        className="h-16 w-16 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-400/60">
        <FontAwesome name="plus" size={24} color="#ffffff" />
      </Pressable>
      <Text className="mt-1 text-xs font-semibold text-blue-700 dark:text-blue-400">Log Flight</Text>
    </View>
  );
}
