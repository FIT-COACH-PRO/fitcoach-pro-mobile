import { useEffect, useState } from 'react';
import type { Session as SupabaseSession, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

/**
 * Deep links de retorno do Supabase Auth. Precisam estar cadastrados como
 * Redirect URLs no dashboard (Authentication > URL Configuration), senão o
 * Supabase recusa o redirectTo e volta pro Site URL padrão.
 */
export const AUTH_REDIRECT_RESET_PASSWORD = 'fitcoachpro://reset-password';
export const AUTH_REDIRECT_EMAIL_CONFIRMED = 'fitcoachpro://email-confirmed';

export function useAuth() {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = (email: string, password: string, meta: SignUpMeta) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: meta, emailRedirectTo: AUTH_REDIRECT_EMAIL_CONFIRMED },
    });

  /** Envia o e-mail de redefinição de senha; o link volta pro app via deep link (useAuthDeepLink). */
  const resetPassword = (email: string) =>
    supabase.auth.resetPasswordForEmail(email, { redirectTo: AUTH_REDIRECT_RESET_PASSWORD });

  const signOut = () => supabase.auth.signOut();

  return { session, user, loading, signIn, signUp, resetPassword, signOut };
}

/** Campos lidos pelo trigger handle_new_user() para criar o perfil no cadastro. */
export type SignUpMeta = {
  full_name: string;
  cpf: string;
  cref: string;
  whatsapp: string;
  city: string;
  state: string;
  birth_date?: string; // ISO; se ausente, o trigger usa a data atual
};
