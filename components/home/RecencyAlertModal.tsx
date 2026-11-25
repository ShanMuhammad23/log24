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
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        <View className="w-full max-w-sm rounded-xl border border-rule bg-white px-5 py-6 dark:border-ruleDark dark:bg-panel">
          <Text className="text-center text-lg font-bold text-ink dark:text-white">
            Recency expires in {daysRemaining} {dayLabel}
          </Text>
          <Text className="mt-2 text-center text-sm text-sub dark:text-mist">
            {daysRemaining} of {RECENCY_PERIOD_DAYS} days remaining. Log a flight soon to stay
            current on your CPL student pilot recency.
          </Text>
          <Pressable onPress={onDismiss} className="mt-5 items-center rounded-lg bg-arc px-4 py-3 active:opacity-90">
            <Text className="text-base font-semibold text-night">Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
