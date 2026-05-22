import Constants from 'expo-constants';
import { Platform, TurboModuleRegistry } from 'react-native';
import { supabase } from '@/utils/supabase';

/**
 * Web Client ID (OAuth client type "Web application") from Google Cloud Console.
 * Must match the Client ID configured in Supabase → Authentication → Google.
 *
 * Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env.local or EAS env vars.
 */
const WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ||
  'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com';

const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();

const EXPO_GO_MESSAGE =
  'Google Sign-In needs a custom dev build (expo-dev-client). It does not run in Expo Go or web. Use: npx expo run:android';

let configured = false;

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

let googleSignInModule: GoogleSignInModule | null = null;
let googleSignInModuleFailed = false;

export function getGoogleWebClientId() {
  return WEB_CLIENT_ID;
}

export function isGoogleSignInConfigured() {
  return WEB_CLIENT_ID.length > 0 && !WEB_CLIENT_ID.startsWith('YOUR_GOOGLE');
}

/** True when the native RNGoogleSignin module is linked (dev/production build). */
export function isNativeGoogleSignInAvailable() {
  if (Platform.OS === 'web') return false;
  if (Constants.appOwnership === 'expo') return false;
  return TurboModuleRegistry.get('RNGoogleSignin') != null;
}

async function loadGoogleSignInModule(): Promise<GoogleSignInModule | null> {
  if (googleSignInModuleFailed) return null;
  if (googleSignInModule) return googleSignInModule;

  if (!isNativeGoogleSignInAvailable()) {
    googleSignInModuleFailed = true;
    return null;
  }

  try {
    googleSignInModule = await import('@react-native-google-signin/google-signin');
    return googleSignInModule;
  } catch {
    googleSignInModuleFailed = true;
    return null;
  }
}

async function ensureGoogleSignInConfigured(mod: GoogleSignInModule) {
  if (configured) return;
  mod.GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    ...(IOS_CLIENT_ID ? { iosClientId: IOS_CLIENT_ID } : {}),
    offlineAccess: false,
    scopes: ['profile', 'email'],
  });
  configured = true;
}

/** Safe no-op at startup — configure runs on first sign-in attempt. */
export function configureGoogleSignIn() {
  // Intentionally empty: avoid loading native module at import time.
}

export type GoogleSignInResult = { error: string | null };

/**
 * Native Google account picker → idToken → Supabase session.
 * Requires a dev/production build with @react-native-google-signin/google-signin linked.
 */
export async function signInWithGoogleNative(): Promise<GoogleSignInResult> {
  if (Platform.OS === 'web') {
    return { error: 'Google Sign-In is only available in the mobile app.' };
  }

  if (!isNativeGoogleSignInAvailable()) {
    return { error: EXPO_GO_MESSAGE };
  }

  if (!isGoogleSignInConfigured()) {
    return {
      error:
        'Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your Web Client ID.',
    };
  }

  const mod = await loadGoogleSignInModule();
  if (!mod) {
    return { error: EXPO_GO_MESSAGE };
  }

  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = mod;

  await ensureGoogleSignInConfigured(mod);

  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return { error: null };
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      return {
        error:
          'Google did not return an ID token. Confirm the Web Client ID is correct and linked in Supabase.',
      };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error: unknown) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          return { error: null };
        case statusCodes.IN_PROGRESS:
          return { error: 'Google Sign-In is already in progress.' };
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return { error: 'Google Play Services is not available or outdated.' };
        default:
          return { error: error.message || 'Google Sign-In failed.' };
      }
    }

    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred during Google Sign-In.';
    return { error: message };
  }
}

/** Clear Google session when signing out (dev build only). */
export async function signOutGoogleNative() {
  if (!isNativeGoogleSignInAvailable()) return;

  const mod = await loadGoogleSignInModule();
  if (!mod) return;

  try {
    await ensureGoogleSignInConfigured(mod);
    await mod.GoogleSignin.signOut();
  } catch {
    // Ignore — Supabase sign-out is the source of truth.
  }
}
