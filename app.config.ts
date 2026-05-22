import type { ConfigContext, ExpoConfig } from 'expo/config';

function isGoogleSignInBuildEnabled() {
  const id = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? '';
  return id.length > 0 && !id.startsWith('YOUR_GOOGLE');
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';

  const plugins: ExpoConfig['plugins'] = [...(config.plugins ?? [])];

  if (isGoogleSignInBuildEnabled()) {
    const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim();
    if (googleIosUrlScheme) {
      plugins.push([
        '@react-native-google-signin/google-signin',
        { iosUrlScheme: googleIosUrlScheme },
      ]);
    } else {
      plugins.push('@react-native-google-signin/google-signin');
    }
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
