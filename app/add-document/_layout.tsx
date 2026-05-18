import { Stack } from 'expo-router';

export default function AddDocumentLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        contentStyle: { backgroundColor: '#f8fafc' },
      }}
    />
  );
}
