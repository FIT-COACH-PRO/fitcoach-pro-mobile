import axios, { AxiosError } from 'axios';
import { API_URL } from '../config';
import { supabase } from '../lib/supabase';

/**
 * Cliente HTTP para as rotas /api do fitcoach-pro (Next.js).
 * Injeta automaticamente o JWT do Supabase como Bearer token.
 *
 * IMPORTANTE: as rotas /api do web hoje autenticam por cookie (SSR).
 * Para o app funcionar, elas precisam aceitar TAMBÉM o header
 * Authorization: Bearer <token>. Veja README.md → "Ajuste no backend".
 */
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url;
    console.warn(`[api] ${status ?? 'ERR'} ${url}`, error.response?.data ?? error.message);
    return Promise.reject(error);
  }
);
