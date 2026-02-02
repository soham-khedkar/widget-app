import { createClient } from '@supabase/supabase-js';
import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store';
import Constants from 'expo-constants';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return getItemAsync(key)
  },
  setItem: (key: string, value: string) => {
    return setItemAsync(key, value)
  },
  removeItem: (key: string) => {
    return deleteItemAsync(key)
  },
};

// Get environment variables with fallback to Constants
const supabaseUrl = 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  Constants.expoConfig?.extra?.supabaseUrl || 
  '';

const supabaseAnonKey = 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  Constants.expoConfig?.extra?.supabaseAnonKey || 
  '';

// Validate configuration
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase configuration missing!\n' +
    'Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.\n' +
    'The app will continue but authentication and data features will not work.'
  );
} else {
  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch {
    console.error(
      '❌ Invalid Supabase URL format!\n' +
      'EXPO_PUBLIC_SUPABASE_URL should be a valid URL (e.g., https://xxxxx.supabase.co)'
    );
  }
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: ExpoSecureStoreAdapter as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);