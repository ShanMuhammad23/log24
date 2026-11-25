import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { INK, MIST, NIGHT } from '@/constants/Colors';
import {
  DEFAULT_CAPACITY_OPTIONS,
  LICENSE_TYPE_OPTIONS,
  ProfileRecord,
  RANK_OPTIONS,
  getProfile,
  toLabel,
} from '@/utils/profile';
import { useSupabaseSession } from '@/utils/auth';

function SkeletonBlock({ className }: { className: string }) {
  return <View className={`rounded bg-rule dark:bg-ruleDark ${className}`} />;
}

function ProfileSkeleton() {
  return (
    <View>
      <View className="mb-3 rounded-xl border border-rule bg-white p-4 dark:border-ruleDark dark:bg-panel">
        <SkeletonBlock className="h-16 w-16 rounded-full" />
        <SkeletonBlock className="mt-3 h-6 w-40" />
        <SkeletonBlock className="mt-2 h-4 w-56" />
        <SkeletonBlock className="mt-4 h-10 rounded-lg" />
      </View>

      <View className="mb-3 rounded-lg border border-rule bg-white p-4 dark:border-ruleDark dark:bg-panel">
        {[1, 2, 3].map((id) => (
          <View key={id} className="mb-3 last:mb-0">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="mt-2 h-5 w-36" />
          </View>
        ))}
      </View>

      <View className="rounded-lg border border-rule bg-white p-4 dark:border-ruleDark dark:bg-panel">
        {[1, 2, 3, 4].map((id) => (
          <View key={id} className="mb-3 last:mb-0">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="mt-2 h-5 w-48" />
          </View>
        ))}
      </View>
    </View>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-3 rounded-md bg-paper p-3 last:mb-0 dark:bg-night">
      <Text className="text-xs font-medium text-sub dark:text-mist">{label}</Text>
      <Text className="mt-1 text-base font-medium text-ink dark:text-white">{value || '-'}</Text>
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
    <View className="flex-1 rounded-md bg-night/10 p-3">
      <FontAwesome name={icon} size={14} color={NIGHT} />
      <Text className="mt-2 text-xs text-night/70">{label}</Text>
      <Text className="mt-1 text-base font-semibold text-night">{value || '-'}</Text>
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
    <View className="mb-3 rounded-lg border border-rule bg-white p-4 dark:border-ruleDark dark:bg-panel">
      <View className="mb-3 flex-row items-center gap-2">
        <View className="h-7 w-7 items-center justify-center rounded-md bg-arc/10">
          <FontAwesome name={icon} size={12} color="#2EA8FF" />
        </View>
        <Text className="text-lg font-semibold text-ink dark:text-white">{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function ProfileScreen() {
  const { session } = useSupabaseSession();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
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
    <SafeAreaView edges={['top']} className="flex-1 bg-paper dark:bg-night">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2EA8FF" />}>
        <View className="mb-5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-lg border border-rule bg-white dark:border-ruleDark dark:bg-panel">
              <FontAwesome name="angle-left" size={18} color={isDark ? MIST : INK} />
            </Pressable>
            <Text className="text-2xl font-bold text-ink dark:text-white">Profile</Text>
          </View>
          <Pressable
            onPress={() => router.push('/profile-edit')}
            className="rounded-lg bg-arc px-4 py-2.5 active:opacity-90">
            <Text className="text-sm font-semibold text-night">Edit</Text>
          </Pressable>
        </View>

        {loading ? (
          <ProfileSkeleton />
        ) : (
          <View>
            <View className="mb-3 rounded-xl bg-arc p-4">
              <View className="flex-row items-center">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-night/10">
                  <FontAwesome name="user-o" size={26} color={NIGHT} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-2xl font-bold text-night">{fullName}</Text>
                  <Text className="mt-1 text-sm text-night/70">{email}</Text>
                </View>
              </View>

              <View className="mt-3 self-start rounded-md bg-night/10 px-3 py-1">
                <Text className="text-sm font-semibold text-night">{rank}</Text>
              </View>

              <View className="mt-3 flex-row gap-2">
                <QuickStat icon="plane" label="Organization" value={profile?.organization || '-'} />
                <QuickStat icon="id-card-o" label="License" value={licenseType} />
              </View>
            </View>

            <SectionCard title="Professional" icon="briefcase">
              <InfoItem label="Default operating capacity" value={capacity} />
              <InfoItem label="Airline / GA / flight school" value={profile?.organization || '-'} />
            </SectionCard>

            <SectionCard title="License details" icon="certificate">
              <InfoItem label="License type" value={licenseType} />
              <InfoItem label="License number" value={profile?.license_number || '-'} />
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
