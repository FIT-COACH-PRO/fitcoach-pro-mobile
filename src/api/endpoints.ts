import { supabase } from '../lib/supabase';
import type {
  Student,
  Workout,
  Session,
  DashboardStats,
  UpcomingRenewal,
} from '../types/database';

/**
 * Acesso a dados direto no Supabase (sem passar pela API do fitcoach-pro).
 *
 * As tabelas têm RLS por `auth.uid() = trainer_id` (migration 001 + 005), então
 * o cliente autenticado como o trainer só enxerga os dados dele — não é preciso
 * um backend intermediário. A lógica aqui replica o que as rotas /api do web
 * faziam; se algum dia o app precisar de operações com segredo de servidor
 * (IA, WhatsApp, PDF, Google Calendar), aí sim voltará a precisar de um backend.
 */

const RENEWAL_WINDOW_DAYS = 7;

/** id do trainer logado; lança se a sessão expirou. */
async function requireUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sessão expirada. Faça login novamente.');
  return user.id;
}

function toDateOnly(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const trainerId = await requireUserId();

  const now = new Date();
  const firstDay = toDateOnly(new Date(now.getFullYear(), now.getMonth(), 1));
  const lastDay = toDateOnly(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const [studentsResult, workoutsResult, paymentsResult, renewals] = await Promise.all([
    supabase.from('students').select('status').eq('trainer_id', trainerId),
    supabase.from('workouts').select('id').eq('trainer_id', trainerId),
    supabase
      .from('payments')
      .select('amount, status')
      .eq('trainer_id', trainerId)
      .gte('due_date', firstDay)
      .lte('due_date', lastDay),
    listUpcomingRenewals(),
  ]);

  if (studentsResult.error) throw new Error(studentsResult.error.message);
  if (workoutsResult.error) throw new Error(workoutsResult.error.message);
  if (paymentsResult.error) throw new Error(paymentsResult.error.message);

  const students = studentsResult.data ?? [];
  const payments = paymentsResult.data ?? [];

  return {
    total_students: students.length,
    active_students: students.filter((s) => s.status === 'active').length,
    inactive_students: students.filter((s) => s.status === 'inactive').length,
    paused_students: students.filter((s) => s.status === 'paused').length,
    total_workouts: workoutsResult.data?.length ?? 0,
    monthly_revenue: payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0),
    pending_payments: payments.filter((p) => p.status === 'pending').length,
    upcoming_renewals: renewals.length,
  };
}

/** Alunos ativos com assinatura vencendo nos próximos 7 dias (seção da Home). */
export async function listUpcomingRenewals(): Promise<UpcomingRenewal[]> {
  const trainerId = await requireUserId();

  const today = new Date();
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + RENEWAL_WINDOW_DAYS);

  const { data, error } = await supabase
    .from('students')
    .select('id, full_name, subscription_end, monthly_fee')
    .eq('trainer_id', trainerId)
    .eq('status', 'active')
    .not('subscription_end', 'is', null)
    .gte('subscription_end', toDateOnly(today))
    .lte('subscription_end', toDateOnly(horizon))
    .order('subscription_end', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as UpcomingRenewal[];
}

export async function listStudents(): Promise<Student[]> {
  const trainerId = await requireUserId();
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('trainer_id', trainerId)
    .order('full_name');

  if (error) throw new Error(error.message);
  return (data ?? []) as Student[];
}

export async function listWorkouts(): Promise<Workout[]> {
  const trainerId = await requireUserId();
  const { data, error } = await supabase
    .from('workouts')
    .select('*, workout_days(*, workout_exercises(*))')
    .eq('trainer_id', trainerId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Workout[];
}

export async function listSessions(): Promise<Session[]> {
  const trainerId = await requireUserId();
  const { data, error } = await supabase
    .from('sessions')
    .select('*, student:students(full_name, whatsapp, whatsapp_opt_in)')
    .eq('trainer_id', trainerId)
    .order('starts_at');

  if (error) throw new Error(error.message);
  return (data ?? []) as Session[];
}

/** Registra o token de push Expo no perfil do trainer (para lembretes). */
export async function registerPushToken(token: string): Promise<void> {
  if (!token.startsWith('ExponentPushToken')) {
    throw new Error('push_token inválido');
  }
  const trainerId = await requireUserId();
  const { error } = await supabase
    .from('profiles')
    .update({ push_token: token })
    .eq('id', trainerId);

  if (error) throw new Error(error.message);
}
