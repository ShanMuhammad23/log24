import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { INK, MIST } from '@/constants/Colors';
import { useSupabaseSession } from '@/utils/auth';
import { supabase } from '@/utils/supabase';

type SubscriptionInfo = {
  plan_code: string;
  status: string;
  current_period_end: string | null;
};

export default function MyAccountScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const { session } = useSupabaseSession();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loadingSub, setLoadingSub] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubscription = async () => {
      const userId = session?.user?.id;
      if (!userId) return;

      setLoadingSub(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('subscriptions')
        .select('plan_code, status, current_period_end')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<SubscriptionInfo>();

      setLoadingSub(false);
      if (queryError) {
        setError(queryError.message);
        return;
      }
      setSubscription(data);
    };

    loadSubscription();
  }, [session?.user?.id]);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently removes your account and all related data. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            setError(null);

            const { error: deleteError } = await supabase.rpc('delete_my_account');
            if (deleteError) {
              setDeleting(false);
              setError(deleteError.message);
              return;
            }

            await supabase.auth.signOut();
            setDeleting(false);
            router.replace('/get-started');
          },
        },
      ]
    );
  };

  const email = session?.user?.email || '-';
  const planCode = subscription?.plan_code || 'No active subscription';
  const status = subscription?.status || '-';
  const renewal = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : '-';

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-paper dark:bg-night">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32 }}>
        <View className="mb-5 flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-lg border border-rule bg-white dark:border-ruleDark dark:bg-panel">
            <FontAwesome name="angle-left" size={18} color={isDark ? MIST : INK} />
          </Pressable>
          <Text className="text-2xl font-bold text-ink dark:text-white">My account</Text>
        </View>

        <View className="overflow-hidden rounded-lg border border-rule bg-white dark:border-ruleDark dark:bg-panel">
          <View className="border-b border-rule px-5 py-4 dark:border-ruleDark">
            <Text className="text-xs font-medium text-sub dark:text-mist">Email</Text>
            <Text className="mt-1 text-base font-medium text-ink dark:text-white">{email}</Text>
          </View>

          <View className="px-5 py-4">
            <Text className="text-xs font-medium text-sub dark:text-mist">Subscription</Text>
            {loadingSub ? (
              <Text className="mt-1 text-base font-medium text-sub dark:text-mist">Loading…</Text>
            ) : (
              <View className="mt-1">
                <Text className="text-base font-medium text-ink dark:text-white">{planCode}</Text>
                <Text className="mt-1 text-sm text-sub dark:text-mist">Status: {status}</Text>
                <Text className="mt-1 text-sm text-sub dark:text-mist">Renewal: {renewal}</Text>
              </View>
            )}
          </View>
        </View>

        {error ? <Text className="mt-4 text-sm text-red-500 dark:text-red-400">{error}</Text> : null}

        <Pressable
          onPress={handleDeleteAccount}
          disabled={deleting}
          className="mt-7 items-center rounded-lg border border-red-200 bg-red-50 py-3.5 active:bg-red-100 disabled:opacity-60 dark:border-red-900/60 dark:bg-red-950/40">
          <Text className="text-base font-semibold text-red-600 dark:text-red-400">
            {deleting ? 'Deleting account…' : 'Delete account'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
