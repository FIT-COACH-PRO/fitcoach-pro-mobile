import Constants from 'expo-constants';

function required(value: string | undefined, name: string): string {
  if (!value) {
    console.warn(`[config] Variável ${name} não definida. Confira o .env`);
    return '';
  }
  return value;
}

// EXPO_PUBLIC_* ficam disponíveis em process.env no bundle do Expo.
export const API_URL = required(
  process.env.EXPO_PUBLIC_API_URL ?? (Constants.expoConfig?.extra?.apiUrl as string | undefined),
  'EXPO_PUBLIC_API_URL'
).replace(/\/$/, '');

export const SUPABASE_URL = required(process.env.EXPO_PUBLIC_SUPABASE_URL, 'EXPO_PUBLIC_SUPABASE_URL');
export const SUPABASE_ANON_KEY = required(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY, 'EXPO_PUBLIC_SUPABASE_ANON_KEY');
