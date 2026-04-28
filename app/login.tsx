import { Link } from 'expo-router';
import { Redirect } from 'expo-router';
import { useAuth, useClerk } from '@clerk/expo';
import { useEffect } from 'react';
import { Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function LoginScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const { redirectToSignIn } = useClerk();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      redirectToSignIn();
    }
  }, [isLoaded, isSignedIn, redirectToSignIn]);

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View className="flex-1 bg-white px-6 pt-14 dark:bg-zinc-950">
      <Text className="text-3xl font-extrabold text-zinc-950 dark:text-zinc-50">Login</Text>
      <Text className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
        Access your pilot logbook account.
      </Text>

      <Text className="mt-8 text-base text-zinc-600 dark:text-zinc-400">
        Redirecting to secure login...
      </Text>

      <View className="mt-5 flex-row items-center justify-center">
        <Text className="text-sm text-zinc-600 dark:text-zinc-400">Don&apos;t have an account? </Text>
        <Link href="/get-started" asChild>
          <Pressable>
            <Text className="text-sm font-semibold text-zinc-950 underline dark:text-zinc-50">Get Started</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
