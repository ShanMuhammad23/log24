import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { themePreferenceLabel, useAppTheme } from '@/contexts/ThemeProvider';
import { MIST, SUB } from '@/constants/Colors';
import { supabase } from '@/utils/supabase';

const SETTINGS_ITEMS = [
  { label: 'My profile', icon: 'user', route: '/profile' },
  { label: 'My account', icon: 'id-card-o', route: '/my-account' },
  { label: 'Reports', icon: 'bar-chart' },
  { label: 'Settings', icon: 'cog' },
  { label: 'Import flights', icon: 'exchange', route: '/import-flights' },
  { label: 'Support & contact', icon: 'life-ring' },
  { label: 'Review & feedback', icon: 'star-o' },
] as const;

export default function MoreScreen() {
  const router = useRouter();
  const { preference, cyclePreference, resolvedScheme } = useAppTheme();
  const isDark = resolvedScheme === 'dark';

  const themeIcon =
    preference === 'dark' ? 'moon-o' : preference === 'light' ? 'sun-o' : ('adjust' as const);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-paper dark:bg-night">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 }}>
        <Text className="mb-5 px-1 text-2xl font-bold text-ink dark:text-white">Menu</Text>

        <View className="overflow-hidden rounded-lg border border-rule bg-white dark:border-ruleDark dark:bg-panel">
          {SETTINGS_ITEMS.map((item, index) => (
            <Pressable
              key={item.label}
              onPress={() => {
                if ('route' in item && item.route) {
                  router.push(item.route as '/profile' | '/my-account' | '/import-flights');
                }
              }}
              className="active:bg-paper dark:active:bg-night"
              android_ripple={{ color: 'rgba(148,163,184,0.2)' }}>
              <View
                className={`flex-row items-center justify-between px-5 py-4 ${
                  index !== SETTINGS_ITEMS.length - 1 ? 'border-b border-rule dark:border-ruleDark' : ''
                }`}>
                <View className="flex-row items-center">
                  <View className="mr-3 h-8 w-8 items-center justify-center rounded-md bg-paper dark:bg-night">
                    <FontAwesome name={item.icon} size={14} color="#2EA8FF" />
                  </View>
                  <Text className="text-base font-medium text-ink dark:text-white">{item.label}</Text>
                </View>
                <FontAwesome name="chevron-right" size={13} color={isDark ? MIST : SUB} />
              </View>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => cyclePreference()}
          className="mt-5 overflow-hidden rounded-lg border border-rule bg-white active:bg-paper dark:border-ruleDark dark:bg-panel dark:active:bg-night"
          android_ripple={{ color: 'rgba(148,163,184,0.2)' }}>
          <View className="flex-row items-center justify-between px-5 py-4">
            <View className="flex-row items-center">
              <View className="mr-3 h-8 w-8 items-center justify-center rounded-md bg-paper dark:bg-night">
                <FontAwesome name={themeIcon} size={14} color="#2EA8FF" />
              </View>
              <View>
                <Text className="text-base font-medium text-ink dark:text-white">App theme</Text>
                <Text className="text-sm text-sub dark:text-mist">{themePreferenceLabel(preference)}</Text>
              </View>
            </View>
            <Text className="text-sm font-semibold text-arcDeep dark:text-arc">Change</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={async () => {
            try {
              const { signOutGoogleNative } = await import('@/utils/google-auth');
              await signOutGoogleNative();
            } catch {
              // Native Google module may be absent in this build.
            }
            await supabase.auth.signOut();
            router.replace('/login');
          }}
          className="mt-7 items-center rounded-lg border border-red-200 bg-red-50 py-3.5 active:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40"
          android_ripple={{ color: 'rgba(244,63,94,0.18)' }}>
          <Text className="text-base font-semibold text-red-600 dark:text-red-400">Logout</Text>
        </Pressable>
        <Text className="mt-7 text-center text-sm text-sub dark:text-mist">
          Made with ❤ by Shan Muhammad from <Link href="https://pilotshala.com" target="_blank">Pilotshala</Link>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
