import Constants from 'expo-constants';

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `[config] Variável ${name} não definida. Confira o .env (ou extra.eas em app.json/eas.json no build).`
    );
  }
  return value;
}

// EXPO_PUBLIC_* ficam disponíveis em process.env no bundle do Expo.
// O app fala direto com o Supabase (RLS por trainer_id); não há mais backend Next.js.
export const SUPABASE_URL = required(
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
    (Constants.expoConfig?.extra?.supabaseUrl as string | undefined),
  'EXPO_PUBLIC_SUPABASE_URL'
);
export const SUPABASE_ANON_KEY = required(
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined),
  'EXPO_PUBLIC_SUPABASE_ANON_KEY'
);
