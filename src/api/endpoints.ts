import { api } from './client';
import type {
  Student,
  Workout,
  Session,
  DashboardStats,
  UpcomingRenewal,
} from '../types/database';

/**
 * Camada fina de acesso às rotas /api do fitcoach-pro.
 * Ajuste os paths conforme as rotas reais do backend forem expostas ao app.
 * (Ex.: hoje o web tem /api/workouts, /api/calendar, /api/cron, etc.)
 */

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/dashboard/stats');
  return data;
}

/** Alunos com assinatura vencendo nos próximos 7 dias (seção da Home). */
export async function listUpcomingRenewals(): Promise<UpcomingRenewal[]> {
  const { data } = await api.get<UpcomingRenewal[]>('/dashboard/renewals');
  return data;
}

export async function listStudents(): Promise<Student[]> {
  const { data } = await api.get<Student[]>('/students');
  return data;
}

export async function listWorkouts(): Promise<Workout[]> {
  const { data } = await api.get<Workout[]>('/workouts');
  return data;
}

export async function listSessions(): Promise<Session[]> {
  const { data } = await api.get<Session[]>('/sessions');
  return data;
}

/** Registra o token de push Expo no backend (para lembretes). */
export async function registerPushToken(token: string): Promise<void> {
  await api.post('/notifications/register-token', { push_token: token });
}
