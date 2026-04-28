import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Redirect } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useState } from 'react';
import { Dimensions, Pressable, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';

const { width } = Dimensions.get('window');
const FEATURE_WIDTH = width - 48;

const FEATURES = [
  {
    icon: 'plane',
    title: 'Track Every Flight',
    description: 'Log sectors, duty hours, and routes in seconds.',
  },
  {
    icon: 'line-chart',
    title: 'Career Insights',
    description: 'See your monthly trends and total hours at a glance.',
  },
  {
    icon: 'calendar-check-o',
    title: 'Roster Sync',
    description: 'Import roster data quickly and keep records updated.',
  },
] as const;

export default function GetStartedScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View className="flex-1 bg-white px-6 pt-12 dark:bg-zinc-950">
      <View className="mb-6">
        <Text className="text-3xl font-extrabold text-zinc-950 dark:text-zinc-50">Sign in</Text>
        <Text className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
          Your digital pilot logbook starts here.
        </Text>
      </View>

      <View className="h-[360px]">
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const nextIndex = Math.round(event.nativeEvent.contentOffset.x / FEATURE_WIDTH);
            setActiveIndex(nextIndex);
          }}>
          {FEATURES.map((feature) => (
            <View
              key={feature.title}
              style={{ width: FEATURE_WIDTH }}
              className="rounded-3xl border border-zinc-200 bg-zinc-50 px-6 py-10 dark:border-zinc-800 dark:bg-zinc-900">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 dark:bg-zinc-100">
                <FontAwesome name={feature.icon} size={26} color={isDark ? '#09090b' : '#ffffff'} />
              </View>
              <Text className="mt-8 text-2xl font-bold text-zinc-950 dark:text-zinc-50">{feature.title}</Text>
              <Text className="mt-3 text-base leading-6 text-zinc-600 dark:text-zinc-400">
                {feature.description}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View className="mt-5 flex-row justify-center">
          {FEATURES.map((feature, idx) => (
            <View
              key={feature.title}
              className={`mx-1.5 h-2 rounded-full ${idx === activeIndex ? 'w-6 bg-zinc-950 dark:bg-zinc-50' : 'w-2 bg-zinc-300 dark:bg-zinc-700'}`}
            />
          ))}
        </View>
      </View>

      <View className="mt-auto pb-10">
        <Link href="/login" asChild>
          <Pressable className="items-center rounded-2xl bg-zinc-950 py-4 dark:bg-zinc-50">
            <Text className="text-base font-semibold text-zinc-50 dark:text-zinc-950">Get Started</Text>
          </Pressable>
        </Link>

        <View className="mt-5 flex-row items-center justify-center">
          <Text className="text-sm text-zinc-600 dark:text-zinc-400">Already have an account? </Text>
          <Link href="/login" asChild>
            <Pressable>
              <Text className="text-sm font-semibold text-zinc-950 underline dark:text-zinc-50">Login</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}
