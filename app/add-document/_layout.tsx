import { Stack } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import { NIGHT, PAPER } from '@/constants/Colors';

export default function AddDocumentLayout() {
  const isDark = useColorScheme() === 'dark';
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        contentStyle: { backgroundColor: isDark ? NIGHT : PAPER },
      }}
    />
  );
}
