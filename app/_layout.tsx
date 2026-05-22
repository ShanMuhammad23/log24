import '../global.css';
import '@/lib/nativewind-fonts';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { useAppFonts } from '@/hooks/useAppFonts';
import { configureDocumentNotificationHandler } from '@/utils/document-notifications';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();

  useEffect(() => {
    SplashScreen.preventAutoHideAsync().catch(() => undefined);
    try {
      configureDocumentNotificationHandler();
    } catch (error) {
      console.warn('Notification handler setup failed:', error);
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (fontError) {
      console.warn('Familjen Grotesk failed to load:', fontError);
    }
  }, [fontError]);

  useEffect(() => {
    if (!fontsLoaded) return;
    import('@/lib/register-default-font');
  }, [fontsLoaded]);

  // Keep ThemeProvider mounted while fonts load — returning null here unmounts it
  // but Expo Router can still render child layouts (e.g. tabs), which breaks useAppTheme.
  const ready = fontsLoaded || fontError;

  return (
    <ThemeProvider>
      {ready ? (
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
      ) : null}
    </ThemeProvider>
  );
}
