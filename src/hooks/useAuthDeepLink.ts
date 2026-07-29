import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { supabase } from '../lib/supabase';

const SCHEME_PREFIX = 'fitcoachpro://';

function parseDeepLink(url: string): { path: string; code: string | null } | null {
  if (!url.startsWith(SCHEME_PREFIX)) return null;
  const rest = url.slice(SCHEME_PREFIX.length);
  const [path, query] = rest.split('?');
  const code = query ? new URLSearchParams(query).get('code') : null;
  return { path, code };
}

/**
 * Processa os deep links de retorno do Supabase Auth (fitcoachpro://reset-password
 * e fitcoachpro://email-confirmed), ambos enviados com ?code=... pelo fluxo PKCE.
 * Troca o code por sessão; se for recuperação de senha, sinaliza recoveryPending
 * para o App mostrar a tela de nova senha antes de liberar o app normal.
 */
export function useAuthDeepLink() {
  const [recoveryPending, setRecoveryPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUrl = useCallback(async (url: string | null) => {
    const parsed = url ? parseDeepLink(url) : null;
    if (!parsed?.code) return;

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(parsed.code);
    if (exchangeError) {
      setError(exchangeError.message);
      return;
    }
    if (parsed.path === 'reset-password') {
      setRecoveryPending(true);
    }
    // 'email-confirmed': a sessão já foi criada acima; onAuthStateChange (useAuth) loga o usuário.
  }, []);

  useEffect(() => {
    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [handleUrl]);

  const clearRecovery = useCallback(() => setRecoveryPending(false), []);

  return { recoveryPending, error, clearRecovery };
}
