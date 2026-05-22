import { Modal, Pressable, View } from 'react-native';

type BottomSheetModalProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Tailwind classes for the sheet panel (not the backdrop). */
  sheetClassName?: string;
};

export function BottomSheetModal({
  visible,
  onClose,
  children,
  sheetClassName = 'max-h-[75%] rounded-t-2xl bg-white px-4 pb-6 pt-4 dark:bg-slate-900',
}: BottomSheetModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0 bg-black/60"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        />
        <View className={sheetClassName}>{children}</View>
      </View>
    </Modal>
  );
}
