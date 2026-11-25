import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Always register the Google Sign-In config plugin so EAS/store builds link the native module.
 * Without this (or without EXPO_PUBLIC_GOOGLE_* on the EAS build), the app shows Google as unavailable.
 *
 * Required EAS production env vars:
 * - EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
 * - EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (iOS)
 * - EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME (iOS; reversed iOS client id, e.g. com.googleusercontent.apps.xxx)
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';
  const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim();

  const plugins: ExpoConfig['plugins'] = [...(config.plugins ?? [])];

  if (googleIosUrlScheme) {
    plugins.push([
      '@react-native-google-signin/google-signin',
      { iosUrlScheme: googleIosUrlScheme },
    ]);
  } else {
    plugins.push('@react-native-google-signin/google-signin');
  }

  return {
    ...config,
    plugins,
    extra: {
      ...config?.extra,
      supabaseUrl,
      supabaseAnonKey,
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
    },
  };
};
