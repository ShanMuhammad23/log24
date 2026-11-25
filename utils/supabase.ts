import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

function readSupabaseConfig() {
  const extra = Constants.expoConfig?.extra as
    | { supabaseUrl?: string; supabaseAnonKey?: string }
    | undefined;

  const url = (process.env.EXPO_PUBLIC_SUPABASE_URL || extra?.supabaseUrl || '').trim();
  const key = (process.env.EXPO_PUBLIC_SUPABASE_KEY || extra?.supabaseAnonKey || '').trim();

  return { url, key };
}

export function isSupabaseConfigured() {
  const { url, key } = readSupabaseConfig();
  return Boolean(url && key);
}

let client: SupabaseClient | null = null;

export function getSupabase() {
  if (client) return client;

  const { url, key } = readSupabaseConfig();
  if (!url || !key) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY in EAS Environment Variables before building.'
    );
  }

  client = createClient(url, key, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return client;
}

export function createSupabaseClient(accessToken?: string | null) {
  const { url, key } = readSupabaseConfig();
  if (!url || !key) {
    throw new Error('Supabase is not configured.');
  }

  return createClient(url, key, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

/** Lazy proxy so missing env does not crash at import time (production EAS builds). */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const instance = getSupabase();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
