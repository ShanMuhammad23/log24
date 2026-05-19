import { Modal, Pressable, Text, View } from 'react-native';
import { RECENCY_PERIOD_DAYS } from '@/utils/recency';

type RecencyAlertModalProps = {
  visible: boolean;
  daysRemaining: number;
  onDismiss: () => void;
};

export function RecencyAlertModal({ visible, daysRemaining, onDismiss }: RecencyAlertModalProps) {
  const dayLabel = daysRemaining === 1 ? 'day' : 'days';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-sm rounded-2xl border border-red-200 bg-white px-5 py-6 dark:border-red-900/50 dark:bg-slate-900">
          <Text className="text-center text-lg font-bold text-red-600 dark:text-red-400">
            Recency Will Expire in {daysRemaining} {dayLabel}
          </Text>
          <Text className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
            Recency Period {RECENCY_PERIOD_DAYS} Days {daysRemaining}/{RECENCY_PERIOD_DAYS} left
          </Text>
          <Text className="mt-3 text-center text-sm text-slate-600 dark:text-slate-300">
            Log a flight soon to stay current on your CPL student pilot recency.
          </Text>
          <Pressable
            onPress={onDismiss}
            className="mt-5 items-center rounded-xl bg-blue-700 px-4 py-3 dark:bg-blue-600">
            <Text className="text-base font-semibold text-white">Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
