import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

/**
 * Cliente Supabase para React Native.
 * Diferente do web (que usa @supabase/ssr com cookies), aqui a sessão
 * é persistida no AsyncStorage. O JWT resultante é enviado como
 * Authorization: Bearer para as rotas /api do fitcoach-pro.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // PKCE: o link de e-mail (recuperação/confirmação) chega com ?code=...,
    // trocado manualmente por sessão em useAuthDeepLink. Evita depender de
    // token na fragment da URL, que não chega de forma confiável via deep link.
    flowType: 'pkce',
  },
});
