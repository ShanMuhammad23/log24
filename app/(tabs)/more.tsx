import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { themePreferenceLabel, useAppTheme } from '@/contexts/ThemeProvider';
import { supabase } from '@/utils/supabase';

const SETTINGS_ITEMS = [
  { label: 'My Profile', icon: 'user', route: '/profile' },
  { label: 'My Account', icon: 'id-card-o', route: '/my-account' },
  { label: 'Reports', icon: 'bar-chart' },
  { label: 'Settings', icon: 'cog' },
  { label: 'Import/Migrate Data', icon: 'exchange', route: '/import-flights' },
  { label: 'Support and Contact', icon: 'life-ring' },
  { label: 'Review App/Feedback', icon: 'star-o' },
] as const;

export default function MoreScreen() {
  const router = useRouter();
  const { preference, cyclePreference } = useAppTheme();

  const themeIcon =
    preference === 'dark' ? 'moon-o' : preference === 'light' ? 'sun-o' : ('adjust' as const);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 }}>
        <Text className="mb-5 px-1 text-2xl font-bold text-slate-900 dark:text-white">Menu</Text>

        <View className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900">
          {SETTINGS_ITEMS.map((item, index) => (
            <Pressable
              key={item.label}
              onPress={() => {
                if ('route' in item && item.route) {
                  router.push(item.route as '/profile' | '/my-account' | '/import-flights');
                }
              }}
              className="active:bg-slate-100 dark:active:bg-slate-800"
              android_ripple={{ color: 'rgba(148,163,184,0.2)' }}>
              <View
                className={`flex-row items-center justify-between px-5 py-4 ${
                  index !== SETTINGS_ITEMS.length - 1 ? 'border-b border-slate-200 dark:border-slate-800' : ''
                }`}>
                <View className="flex-row items-center">
                  <View className="mr-3 h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                    <FontAwesome name={item.icon} size={14} color="#2563eb" />
                  </View>
                  <Text className="text-base font-medium text-slate-800 dark:text-slate-100">{item.label}</Text>
                </View>
                <FontAwesome name="chevron-right" size={13} color="#94a3b8" />
              </View>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => cyclePreference()}
          className="mt-5 overflow-hidden rounded-2xl bg-white active:bg-slate-100 dark:bg-slate-900 dark:active:bg-slate-800"
          android_ripple={{ color: 'rgba(148,163,184,0.2)' }}>
          <View className="flex-row items-center justify-between px-5 py-4">
            <View className="flex-row items-center">
              <View className="mr-3 h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <FontAwesome name={themeIcon} size={14} color="#2563eb" />
              </View>
              <View>
                <Text className="text-base font-medium text-slate-800 dark:text-slate-100">App Theme</Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400">{themePreferenceLabel(preference)}</Text>
              </View>
            </View>
            <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">Change</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={async () => {
            await supabase.auth.signOut();
            router.replace('/login');
          }}
          className="mt-7 items-center rounded-xl bg-red-600 py-3.5 active:bg-red-700"
          android_ripple={{ color: 'rgba(244,63,94,0.18)' }}>
          <Text className="text-base font-semibold text-white">Logout</Text>
        </Pressable>
        <Text className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
          Made with ❤ by Shan Muhammad from <Link href="https://pilotshala.com" target="_blank">Pilotshala</Link>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
