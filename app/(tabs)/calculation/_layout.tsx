import { Stack } from 'expo-router';

export default function CalculationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0D1117' },
        animation: 'slide_from_right',
      }}
    />
  );
}
