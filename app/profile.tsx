import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DEFAULT_CAPACITY_OPTIONS,
  LICENSE_TYPE_OPTIONS,
  ProfileRecord,
  RANK_OPTIONS,
  getProfile,
  toLabel,
} from '@/utils/profile';
import { useSupabaseSession } from '@/utils/auth';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="border-b border-slate-800 px-5 py-4 last:border-b-0">
      <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</Text>
      <Text className="mt-1 text-base font-medium text-slate-100">{value || '-'}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { session } = useSupabaseSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) return;

    const { data, error: fetchError } = await getProfile(userId);

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setError(null);
    setProfile(data);
  }, [session?.user?.id]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await loadProfile();
      if (mounted) setLoading(false);
    };

    run();
    return () => {
      mounted = false;
    };
  }, [loadProfile, session?.user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const fullName = profile?.full_name || session?.user?.user_metadata?.full_name || '-';
  const email = profile?.email || session?.user?.email || '-';

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#94a3b8" />}>
        <View className="mb-5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-800">
              <FontAwesome name="angle-left" size={18} color="#e2e8f0" />
            </Pressable>
            <Text className="text-2xl font-bold text-white">My Profile</Text>
          </View>
          <Pressable
            onPress={() => router.push('/profile-edit')}
            className="rounded-xl bg-blue-600 px-4 py-2.5 active:bg-blue-700">
            <Text className="text-sm font-semibold text-white">Edit</Text>
          </Pressable>
        </View>

        {loading ? (
          <View className="mt-10 items-center">
            <ActivityIndicator color="#93c5fd" />
          </View>
        ) : (
          <View className="overflow-hidden rounded-2xl bg-slate-900">
            <DetailRow label="Name" value={fullName} />
            <DetailRow label="Rank" value={toLabel(profile?.rank, RANK_OPTIONS)} />
            <DetailRow
              label="Default Operating Capacity"
              value={toLabel(profile?.default_operating_capacity, DEFAULT_CAPACITY_OPTIONS)}
            />
            <DetailRow label="Airline/GA/Flight School" value={profile?.organization || '-'} />
            <DetailRow label="License Type" value={toLabel(profile?.license_type, LICENSE_TYPE_OPTIONS)} />
            <DetailRow label="License Number" value={profile?.license_number || '-'} />
            <DetailRow label="Country" value={profile?.country || '-'} />
            <DetailRow label="Email" value={email} />
          </View>
        )}

        {error ? <Text className="mt-4 text-sm text-red-400">{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
