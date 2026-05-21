import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSupabaseSession } from '@/utils/auth';

function MissingConfigScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50 px-6 dark:bg-slate-950">
      <View className="flex-1 items-center justify-center">
        <Text className="mb-2 text-center text-xl font-bold text-slate-900 dark:text-slate-100">
          App configuration missing
        </Text>
        <Text className="text-center text-base leading-6 text-slate-600 dark:text-slate-400">
          This build was created without Supabase environment variables. Add EXPO_PUBLIC_SUPABASE_URL and
          EXPO_PUBLIC_SUPABASE_KEY to your EAS project environment, then create a new production build.
        </Text>
      </View>
    </SafeAreaView>
  );
}

export default function IndexRoute() {
  const { session, loading, configMissing } = useSupabaseSession();

  if (configMissing) {
    return <MissingConfigScreen />;
  }

  if (loading) {
    return null;
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/get-started" />;
}
