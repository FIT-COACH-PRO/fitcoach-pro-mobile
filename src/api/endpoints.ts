import { supabase } from '../lib/supabase';
import type {
  Profile,
  Student,
  Workout,
  Session,
  Payment,
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

/** Um aluno do trainer logado (para a tela de detalhe). */
export async function getStudent(id: string): Promise<Student> {
  const trainerId = await requireUserId();
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('trainer_id', trainerId)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as Student;
}

/** Campos que o trainer preenche ao cadastrar/editar um aluno. */
export type StudentInput = {
  full_name: string;
  whatsapp: string;
  email?: string | null;
  status: Student['status'];
  objective?: string | null;
  monthly_fee?: number | null;
};

/** Cadastra um aluno. RLS garante trainer_id = auth.uid() (migration 001). */
export async function createStudent(input: StudentInput): Promise<Student> {
  const trainerId = await requireUserId();
  const { data, error } = await supabase
    .from('students')
    .insert({
      trainer_id: trainerId,
      full_name: input.full_name,
      whatsapp: input.whatsapp,
      email: input.email ?? null,
      status: input.status,
      objective: input.objective ?? null,
      monthly_fee: input.monthly_fee ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Student;
}

/** Atualiza um aluno existente do trainer logado. */
export async function updateStudent(id: string, input: StudentInput): Promise<Student> {
  const trainerId = await requireUserId();
  const { data, error } = await supabase
    .from('students')
    .update({
      full_name: input.full_name,
      whatsapp: input.whatsapp,
      email: input.email ?? null,
      status: input.status,
      objective: input.objective ?? null,
      monthly_fee: input.monthly_fee ?? null,
    })
    .eq('trainer_id', trainerId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Student;
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

/** Um treino com dias e exercícios aninhados (para a tela de detalhe). */
export async function getWorkout(id: string): Promise<Workout> {
  const trainerId = await requireUserId();
  const { data, error } = await supabase
    .from('workouts')
    .select('*, workout_days(*, workout_exercises(*))')
    .eq('trainer_id', trainerId)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as Workout;
}

export type WorkoutExerciseInput = {
  exercise_name: string;
  sets?: number | null;
  reps?: string | null;
  weight?: string | null;
};

export type WorkoutDayInput = {
  name: string; // rótulo do dia, ex.: "Treino A"
  exercises: WorkoutExerciseInput[];
};

export type WorkoutInput = {
  name: string;
  student_id?: string | null;
  difficulty?: Workout['difficulty'];
  description?: string | null;
  days: WorkoutDayInput[];
};

/**
 * Cria um treino em cascata: workouts → workout_days → workout_exercises.
 * Sem transação no cliente: em caso de falha após criar o workout, apaga-o
 * (o ON DELETE CASCADE remove dias/exercícios) para não deixar órfão.
 */
export async function createWorkout(input: WorkoutInput): Promise<Workout> {
  const trainerId = await requireUserId();

  const { data: workout, error: wErr } = await supabase
    .from('workouts')
    .insert({
      trainer_id: trainerId,
      student_id: input.student_id ?? null,
      name: input.name,
      description: input.description ?? null,
      difficulty: input.difficulty ?? null,
      days_per_week: input.days.length,
      type: 'custom',
    })
    .select()
    .single();

  if (wErr) throw new Error(wErr.message);
  const workoutId = (workout as Workout).id;

  try {
    const daysPayload = input.days.map((d, i) => ({
      workout_id: workoutId,
      name: d.name,
      day_label: d.name,
      day_order: i,
    }));
    const { data: days, error: dErr } = await supabase
      .from('workout_days')
      .insert(daysPayload)
      .select('id, day_order');
    if (dErr) throw new Error(dErr.message);

    const sortedDays = ([...(days ?? [])] as { id: string; day_order: number }[]).sort(
      (a, b) => a.day_order - b.day_order
    );

    const exPayload = sortedDays.flatMap((day, i) =>
      input.days[i].exercises.map((ex, j) => ({
        workout_day_id: day.id,
        workout_id: workoutId,
        exercise_name: ex.exercise_name,
        sets: ex.sets ?? null,
        reps: ex.reps ?? null,
        weight: ex.weight ?? null,
        exercise_order: j,
      }))
    );

    if (exPayload.length > 0) {
      const { error: eErr } = await supabase.from('workout_exercises').insert(exPayload);
      if (eErr) throw new Error(eErr.message);
    }

    return workout as Workout;
  } catch (e) {
    // Limpeza best-effort para não deixar treino órfão.
    await supabase.from('workouts').delete().eq('id', workoutId);
    throw e;
  }
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

export async function listPayments(): Promise<Payment[]> {
  const trainerId = await requireUserId();
  const { data, error } = await supabase
    .from('payments')
    .select('*, student:students(full_name)')
    .eq('trainer_id', trainerId)
    .order('due_date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Payment[];
}

/** Campos que o trainer preenche ao registrar um pagamento. */
export type PaymentInput = {
  student_id: string;
  amount: number;
  due_date: string; // ISO (YYYY-MM-DD)
  status: Payment['status'];
  payment_method?: Payment['payment_method'];
  payment_date?: string | null;
};

/** Registra um pagamento. RLS garante trainer_id = auth.uid() (migration 001). */
export async function createPayment(input: PaymentInput): Promise<Payment> {
  const trainerId = await requireUserId();
  const { data, error } = await supabase
    .from('payments')
    .insert({
      trainer_id: trainerId,
      student_id: input.student_id,
      amount: input.amount,
      due_date: input.due_date,
      status: input.status,
      payment_method: input.payment_method ?? null,
      payment_date: input.payment_date ?? null,
    })
    .select('*, student:students(full_name)')
    .single();

  if (error) throw new Error(error.message);
  return data as Payment;
}

/** Campos que o trainer preenche ao agendar uma aula. */
export type SessionInput = {
  student_id: string;
  starts_at: string; // ISO
  ends_at: string; // ISO
};

/** Agenda uma aula. A tabela impede sobreposição de horários (constraint EXCLUDE). */
export async function createSession(input: SessionInput): Promise<Session> {
  const trainerId = await requireUserId();
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      trainer_id: trainerId,
      student_id: input.student_id,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
    })
    .select('*, student:students(full_name, whatsapp, whatsapp_opt_in)')
    .single();

  if (error) {
    // 23P01 = exclusion_violation (janela de horário sobreposta com outra aula).
    if (error.code === '23P01') throw new Error('Já existe uma aula nesse horário.');
    throw new Error(error.message);
  }
  return data as Session;
}

/** Perfil do trainer logado. */
export async function getProfile(): Promise<Profile> {
  const trainerId = await requireUserId();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', trainerId)
    .single();

  if (error) throw new Error(error.message);
  return data as Profile;
}

/** Campos editáveis do perfil (cpf/e-mail/nascimento ficam de fora). */
export type ProfileInput = {
  full_name: string;
  whatsapp: string;
  phone?: string | null;
  cref: string;
  city: string;
  state: string;
  bio?: string | null;
};

export async function updateProfile(input: ProfileInput): Promise<Profile> {
  const trainerId = await requireUserId();
  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: input.full_name,
      whatsapp: input.whatsapp,
      phone: input.phone ?? null,
      cref: input.cref,
      city: input.city,
      state: input.state,
      bio: input.bio ?? null,
    })
    .eq('id', trainerId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Mantém o metadata do auth em sincronia — Home e Configurações leem full_name de lá.
  await supabase.auth.updateUser({ data: { full_name: input.full_name, whatsapp: input.whatsapp } });
  return data as Profile;
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
