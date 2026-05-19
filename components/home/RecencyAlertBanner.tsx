import { Text, View } from 'react-native';
import { RECENCY_PERIOD_DAYS } from '@/utils/recency';

type RecencyAlertBannerProps = {
  daysRemaining: number;
};

export function RecencyAlertBanner({ daysRemaining }: RecencyAlertBannerProps) {
  const dayLabel = daysRemaining === 1 ? 'day' : 'days';

  return (
    <View className="mx-5 mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/40">
      <Text className=" text-base font-bold text-red-600 dark:text-red-400">
        {daysRemaining > 0 ? 'Recency Will Expire in' : 'Recency Has Expired'}
      </Text>
      {daysRemaining > 0 && (
        <Text className="mt-1  text-sm text-slate-500 dark:text-slate-400">
          Recency Period {RECENCY_PERIOD_DAYS} Days {daysRemaining}/{RECENCY_PERIOD_DAYS} days left
        </Text>
      )}
      {daysRemaining === 0 && (
        <Text className="mt-1  text-sm text-slate-500 dark:text-slate-400">
          Recency Period {RECENCY_PERIOD_DAYS} Days {daysRemaining}/{RECENCY_PERIOD_DAYS} days left
        </Text>
      )}
      
    </View>
  );
}
