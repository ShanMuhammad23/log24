import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
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

function ProfileSkeleton() {
  return (
    <View>
      <View className="mb-3 rounded-3xl bg-slate-200 p-4">
        <View className="h-16 w-16 rounded-full bg-slate-300" />
        <View className="mt-3 h-6 w-40 rounded bg-slate-300" />
        <View className="mt-2 h-4 w-56 rounded bg-slate-300" />
        <View className="mt-4 h-10 rounded-xl bg-slate-300" />
      </View>

      <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4">
        {[1, 2, 3].map((id) => (
          <View key={id} className="mb-3 last:mb-0">
            <View className="h-3 w-24 rounded bg-slate-200" />
            <View className="mt-2 h-5 w-36 rounded bg-slate-200" />
          </View>
        ))}
      </View>

      <View className="rounded-2xl border border-slate-200 bg-white p-4">
        {[1, 2, 3, 4].map((id) => (
          <View key={id} className="mb-3 last:mb-0">
            <View className="h-3 w-20 rounded bg-slate-200" />
            <View className="mt-2 h-5 w-48 rounded bg-slate-200" />
          </View>
        ))}
      </View>
    </View>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-3 rounded-xl bg-slate-50 p-3 last:mb-0">
      <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</Text>
      <Text className="mt-1 text-base font-medium text-slate-900">{value || '-'}</Text>
    </View>
  );
}

function QuickStat({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 rounded-xl bg-white/15 p-3">
      <FontAwesome name={icon} size={14} color="#dbeafe" />
      <Text className="mt-2 text-xs uppercase text-blue-100">{label}</Text>
      <Text className="mt-1 text-base font-semibold text-white">{value || '-'}</Text>
    </View>
  );
}

function ValueChip({ value }: { value: string }) {
  return (
    <View className="self-start rounded-full bg-blue-100 px-3 py-1">
      <Text className="text-sm font-semibold text-blue-700">{value || '-'}</Text>
    </View>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  children: React.ReactNode;
}) {
  return (
    <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4">
      <View className="mb-3 flex-row items-center gap-2">
        <View className="h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
          <FontAwesome name={icon} size={12} color="#1d4ed8" />
        </View>
        <Text className="text-lg font-semibold text-slate-900">{title}</Text>
      </View>
      {children}
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
  const rank = toLabel(profile?.rank, RANK_OPTIONS);
  const capacity = toLabel(profile?.default_operating_capacity, DEFAULT_CAPACITY_OPTIONS);
  const licenseType = toLabel(profile?.license_type, LICENSE_TYPE_OPTIONS);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}>
        <View className="mb-5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-200">
              <FontAwesome name="angle-left" size={18} color="#0f172a" />
            </Pressable>
            <Text className="text-2xl font-bold text-slate-900">My Profile</Text>
          </View>
          <Pressable
            onPress={() => router.push('/profile-edit')}
            className="rounded-xl bg-blue-600 px-4 py-2.5 active:bg-blue-700">
            <Text className="text-sm font-semibold text-white">Edit</Text>
          </Pressable>
        </View>

        {loading ? (
          <ProfileSkeleton />
        ) : (
          <View>
            <View className="mb-3 rounded-3xl bg-blue-700 p-4">
              <View className="flex-row items-center">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-white/20">
                  <FontAwesome name="user-o" size={26} color="#ffffff" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-2xl font-bold text-white">{fullName}</Text>
                  <Text className="mt-1 text-sm text-blue-100">{email}</Text>
                </View>
              </View>

              <View className="mt-3">
                <ValueChip value={rank} />
              </View>

              <View className="mt-3 flex-row gap-2">
                <QuickStat icon="plane" label="Organization" value={profile?.organization || '-'} />
                <QuickStat icon="id-card-o" label="License" value={licenseType} />
              </View>
            </View>

            <SectionCard title="Professional" icon="briefcase">
              <InfoItem label="Default Operating Capacity" value={capacity} />
              <InfoItem label="Airline / GA / Flight School" value={profile?.organization || '-'} />
            </SectionCard>

            <SectionCard title="License Details" icon="certificate">
              <InfoItem label="License Type" value={licenseType} />
              <InfoItem label="License Number" value={profile?.license_number || '-'} />
              <InfoItem label="Country" value={profile?.country || '-'} />
            </SectionCard>

            <SectionCard title="Account" icon="envelope-o">
              <InfoItem label="Email" value={email} />
            </SectionCard>
          </View>
        )}

        {error ? <Text className="mt-4 text-sm text-red-500">{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
