import { Stack } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import { NIGHT, PAPER } from '@/constants/Colors';

export default function CalculationLayout() {
  const isDark = useColorScheme() === 'dark';
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDark ? NIGHT : PAPER },
        animation: 'slide_from_right',
      }}
    />
  );
}
