import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSupabaseSession } from '@/utils/auth';
import { supabase } from '@/utils/supabase';

type SubscriptionInfo = {
  plan_code: string;
  status: string;
  current_period_end: string | null;
};

export default function MyAccountScreen() {
  const router = useRouter();
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
      'This will permanently remove your account and related data. This action cannot be undone.',
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
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32 }}>
        <View className="mb-5 flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-800">
            <FontAwesome name="angle-left" size={18} color="#e2e8f0" />
          </Pressable>
          <Text className="text-2xl font-bold text-white">My Account</Text>
        </View>

        <View className="overflow-hidden rounded-2xl bg-slate-900">
          <View className="border-b border-slate-800 px-5 py-4">
            <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</Text>
            <Text className="mt-1 text-base font-medium text-slate-100">{email}</Text>
          </View>

          <View className="px-5 py-4">
            <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">Subscription</Text>
            {loadingSub ? (
              <Text className="mt-1 text-base font-medium text-slate-300">Loading...</Text>
            ) : (
              <View className="mt-1">
                <Text className="text-base font-medium text-slate-100">{planCode}</Text>
                <Text className="mt-1 text-sm text-slate-300">Status: {status}</Text>
                <Text className="mt-1 text-sm text-slate-300">Renewal: {renewal}</Text>
              </View>
            )}
          </View>
        </View>

        {error ? <Text className="mt-4 text-sm text-red-400">{error}</Text> : null}

        <Pressable
          onPress={handleDeleteAccount}
          disabled={deleting}
          className="mt-7 items-center rounded-xl bg-red-600 py-3.5 active:bg-red-700 disabled:opacity-60"
          android_ripple={{ color: 'rgba(244,63,94,0.18)' }}>
          <Text className="text-base font-semibold text-white">
            {deleting ? 'Deleting account...' : 'Delete Account'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
