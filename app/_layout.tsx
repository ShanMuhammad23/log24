import '../global.css';
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeProvider';

export default function RootLayout() {
  return (
    <ThemeProvider>
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        contentStyle: { backgroundColor: '#f8fafc' },
      }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen
        name="flight-details"
        options={{
          animation: 'slide_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="add-document"
        options={{
          animation: 'slide_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="document-details"
        options={{
          animation: 'slide_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
    </Stack>
    </ThemeProvider>
  );
}
