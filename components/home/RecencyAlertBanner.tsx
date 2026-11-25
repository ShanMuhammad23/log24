import { Text, View } from 'react-native';
import { RECENCY_PERIOD_DAYS } from '@/utils/recency';

type RecencyAlertBannerProps = {
  daysRemaining: number;
};

export function RecencyAlertBanner({ daysRemaining }: RecencyAlertBannerProps) {
  const expired = daysRemaining <= 0;

  return (
    <View className="mx-5 mb-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 dark:border-red-900/60 dark:bg-red-950/40">
      <Text className="text-base font-bold text-red-600 dark:text-red-400">
        {expired ? 'Recency expired' : `Recency expires in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`}
      </Text>
      <Text className="mt-1 text-sm text-red-500/80 dark:text-red-300/80">
        {Math.max(daysRemaining, 0)} of {RECENCY_PERIOD_DAYS} days remaining — log a flight to stay current.
      </Text>
    </View>
  );
}
