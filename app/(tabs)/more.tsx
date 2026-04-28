import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/utils/supabase';

const SETTINGS_ITEMS = [
  { label: 'My Profile', icon: 'user', route: '/profile' },
  { label: 'My Account', icon: 'id-card-o' },
  { label: 'Reports', icon: 'bar-chart' },
  { label: 'License and Expiries', icon: 'calendar' },
  { label: 'Settings', icon: 'cog' },
  { label: 'Import/Migrate Data', icon: 'exchange' },
  { label: 'Support and Contact', icon: 'life-ring' },
  { label: 'Review App/Feedback', icon: 'star-o' },
] as const;

export default function MoreScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32 }}>
        <Text className="mb-5 px-1 text-2xl font-bold text-white">Settings</Text>

        <View className="overflow-hidden rounded-2xl bg-slate-900">
          {SETTINGS_ITEMS.map((item, index) => (
            <Pressable
              key={item.label}
              onPress={() => {
                if (item.route) {
                  router.push(item.route as '/profile');
                }
              }}
              className="active:bg-slate-800"
              android_ripple={{ color: 'rgba(148,163,184,0.2)' }}>
              <View
                className={`flex-row items-center justify-between px-5 py-4 ${
                  index !== SETTINGS_ITEMS.length - 1 ? 'border-b border-slate-800' : ''
                }`}>
                <View className="flex-row items-center">
                  <View className="mr-3 h-8 w-8 items-center justify-center rounded-lg bg-slate-800">
                    <FontAwesome name={item.icon} size={14} color="#bfdbfe" />
                  </View>
                  <Text className="text-base font-medium text-slate-100">{item.label}</Text>
                </View>
                <FontAwesome name="chevron-right" size={13} color="#94a3b8" />
              </View>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={async () => {
            await supabase.auth.signOut();
            router.replace('/login');
          }}
          className="mt-7 items-center rounded-xl bg-red-600 py-3.5 active:bg-red-700"
          android_ripple={{ color: 'rgba(244,63,94,0.18)' }}>
          <Text className="text-base font-semibold text-white">Logout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
