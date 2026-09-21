import { supabase } from '../lib/supabase';
import type {
  Profile,
  Student,
  Workout,
  Session,
  Payment,
  ExerciseLibrary,
  DashboardStats,
  UpcomingRenewal,
} from '../types/database';
import type {
  Program,
  ProgramWorkout,
  StudentProgress,
  ExerciseLog,
  ExerciseSubstitute,
  CommunityAnnouncement,
  SessionModalidade,
} from '../types/extras';
import { clampAlertDays, DEFAULT_RENEWAL_ALERT_DAYS } from '../lib/renewals';
import { findSessionConflict, describeConflict } from '../lib/agenda';

/**
 * Acesso a dados direto no Supabase (sem passar pela API do fitcoach-pro).
 *
 * As tabelas têm RLS por `auth.uid() = trainer_id` (migration 001 + 005), então
 * o cliente autenticado como o trainer só enxerga os dados dele — não é preciso
 * um backend intermediário. A lógica aqui replica o que as rotas /api do web
 * faziam; se algum dia o app precisar de operações com segredo de servidor
 * (IA, WhatsApp, PDF, Google Calendar), aí sim voltará a precisar de um backend.
 */

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

/** `alertDays` evita reconsultar o perfil quando a Home já leu a janela. */
export async function getDashboardStats(alertDays?: number): Promise<DashboardStats> {
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
    listUpcomingRenewals(alertDays),
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

/**
 * Janela do alerta de vencimento configurada pelo personal
 * (profiles.renewal_alert_days, migration 006). Cai no default se a coluna
 * ainda não existir no banco — o app não quebra antes da migration rodar.
 */
export async function getRenewalAlertDays(): Promise<number> {
  const trainerId = await requireUserId();
  const { data, error } = await supabase
    .from('profiles')
    .select('renewal_alert_days')
    .eq('id', trainerId)
    .single();

  if (error) return DEFAULT_RENEWAL_ALERT_DAYS;
  return clampAlertDays((data as { renewal_alert_days: number | null } | null)?.renewal_alert_days);
}

/** Salva a antecedência do alerta de vencimento (1 a 90 dias). */
export async function updateRenewalAlertDays(days: number): Promise<number> {
  const trainerId = await requireUserId();
  const value = clampAlertDays(days);
  const { error } = await supabase
    .from('profiles')
    .update({ renewal_alert_days: value })
    .eq('id', trainerId);

  if (error) throw new Error(error.message);
  return value;
}

/**
 * Alunos ativos com assinatura vencendo dentro da janela de alerta do personal
 * (seção da Home). `alertDays` evita reconsultar o perfil quando quem chama já
 * tem o valor.
 */
export async function listUpcomingRenewals(alertDays?: number): Promise<UpcomingRenewal[]> {
  const trainerId = await requireUserId();
  const window = alertDays != null ? clampAlertDays(alertDays) : await getRenewalAlertDays();

  const today = new Date();
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + window);

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
  /** Só presencial x presencial gera conflito de horário (migration 006). */
  modalidade?: SessionModalidade;
};

/**
 * Agenda uma aula.
 *
 * A checagem de conflito roda duas vezes de propósito: aqui, contra as aulas já
 * carregadas, para dar uma mensagem que diz *qual* aula colide; e no banco, na
 * constraint EXCLUDE parcial, que é a garantia real contra corrida entre dois
 * dispositivos. Aula online não conflita com nada.
 */
export async function createSession(input: SessionInput): Promise<Session> {
  const trainerId = await requireUserId();
  const modalidade: SessionModalidade = input.modalidade ?? 'presencial';

  if (modalidade === 'presencial') {
    const existing = await listSessions();
    const clash = findSessionConflict(
      { starts_at: input.starts_at, ends_at: input.ends_at, modalidade },
      existing
    );
    if (clash) {
      throw new Error(`Conflito com a aula ${describeConflict(clash)}.`);
    }
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      trainer_id: trainerId,
      student_id: input.student_id,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      modalidade,
    })
    .select('*, student:students(full_name, whatsapp, whatsapp_opt_in)')
    .single();

  if (error) {
    // 23P01 = exclusion_violation (janela de horário sobreposta com outra aula
    // presencial). Só cai aqui se algo entrou entre a checagem acima e o insert.
    if (error.code === '23P01') throw new Error('Já existe uma aula presencial nesse horário.');
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

/**
 * Gera insights de IA para um aluno via Edge Function do Supabase.
 * A chave da Anthropic fica no servidor (secret da função) — nunca no app.
 * O `functions.invoke` envia o JWT do trainer, então a função respeita a RLS.
 */
export async function getStudentInsights(studentId: string): Promise<string> {
  await requireUserId(); // garante sessão ativa antes de chamar a função
  const { data, error } = await supabase.functions.invoke('student-insights', {
    body: { student_id: studentId },
  });
  if (error) {
    throw new Error('Não foi possível gerar os insights. Verifique se a função de IA está publicada.');
  }
  const text = (data as { insights?: string } | null)?.insights;
  if (!text) throw new Error('A IA não retornou um resultado.');
  return text;
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

// ============================================================
// Programas / mesociclos (migration 006)
// ============================================================

export async function listPrograms(): Promise<Program[]> {
  const trainerId = await requireUserId();
  const { data, error } = await supabase
    .from('programs')
    .select('*, program_workouts(*, workout:workouts(id, name, difficulty))')
    .eq('trainer_id', trainerId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Program[];
}

export async function getProgram(id: string): Promise<Program> {
  const trainerId = await requireUserId();
  const { data, error } = await supabase
    .from('programs')
    .select('*, program_workouts(*, workout:workouts(id, name, difficulty))')
    .eq('trainer_id', trainerId)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as Program;
}

export type ProgramWorkoutInput = {
  workout_id: string;
  /** 0 = domingo … 6 = sábado (mesma convenção de student_workout_schedules). */
  weekday: number;
  workout_label?: string | null;
};

export type ProgramInput = {
  name: string;
  description?: string | null;
  duration_weeks?: number | null;
  workouts: ProgramWorkoutInput[];
};

/**
 * Cria um programa com sua sequência de treinos. Sem transação no cliente: se
 * a inserção da sequência falhar, apaga o programa (CASCADE limpa o resto) —
 * mesmo padrão de createWorkout.
 */
export async function createProgram(input: ProgramInput): Promise<Program> {
  const trainerId = await requireUserId();

  const { data: program, error: pErr } = await supabase
    .from('programs')
    .insert({
      trainer_id: trainerId,
      name: input.name,
      description: input.description ?? null,
      duration_weeks: input.duration_weeks ?? null,
    })
    .select()
    .single();

  if (pErr) throw new Error(pErr.message);
  const programId = (program as Program).id;

  try {
    if (input.workouts.length > 0) {
      const payload = input.workouts.map((w, i) => ({
        program_id: programId,
        workout_id: w.workout_id,
        position: i,
        weekday: w.weekday,
        workout_label: w.workout_label ?? null,
      }));
      const { error: pwErr } = await supabase.from('program_workouts').insert(payload);
      if (pwErr) throw new Error(pwErr.message);
    }
    return program as Program;
  } catch (e) {
    await supabase.from('programs').delete().eq('id', programId);
    throw e;
  }
}

/**
 * Atribui o programa inteiro a um aluno de uma vez.
 *
 * Reaproveita o vínculo treino-aluno que já existia (student_workout_schedules):
 * cada treino do programa vira uma linha da grade semanal, marcada com
 * program_id. Uma atribuição anterior do MESMO programa é desativada antes,
 * para não duplicar a grade; grades avulsas do aluno não são tocadas.
 */
export async function assignProgramToStudent(
  programId: string,
  studentId: string
): Promise<number> {
  const trainerId = await requireUserId();
  const program = await getProgram(programId);
  const items = [...(program.program_workouts ?? [])].sort((a, b) => a.position - b.position);

  if (items.length === 0) throw new Error('O programa não tem treinos para atribuir.');

  const { error: offErr } = await supabase
    .from('student_workout_schedules')
    .update({ is_active: false })
    .eq('trainer_id', trainerId)
    .eq('student_id', studentId)
    .eq('program_id', programId);
  if (offErr) throw new Error(offErr.message);

  const payload = items.map((item: ProgramWorkout) => ({
    student_id: studentId,
    trainer_id: trainerId,
    workout_id: item.workout_id,
    program_id: programId,
    weekday: item.weekday,
    workout_label: item.workout_label ?? program.name,
    is_active: true,
  }));

  const { error } = await supabase.from('student_workout_schedules').insert(payload);
  if (error) throw new Error(error.message);
  return payload.length;
}

// ============================================================
// Histórico de progresso do aluno (migration 006)
// ============================================================

/** Snapshots de peso/IMC do aluno, do mais recente para o mais antigo. */
export async function listStudentProgress(studentId: string): Promise<StudentProgress[]> {
  const trainerId = await requireUserId();
  const { data, error } = await supabase
    .from('student_progress')
    .select('*')
    .eq('trainer_id', trainerId)
    .eq('student_id', studentId)
    .order('recorded_on', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as StudentProgress[];
}

export type StudentProgressInput = {
  student_id: string;
  weight: number;
  /** Metros (1.68) ou centímetros (168); o banco normaliza no cálculo do IMC. */
  height?: number | null;
  recorded_on?: string; // YYYY-MM-DD (default: hoje, no banco)
  notes?: string | null;
};

/** Registra um snapshot novo — nunca sobrescreve o anterior. */
export async function createStudentProgress(
  input: StudentProgressInput
): Promise<StudentProgress> {
  const trainerId = await requireUserId();
  const { data, error } = await supabase
    .from('student_progress')
    .insert({
      trainer_id: trainerId,
      student_id: input.student_id,
      weight: input.weight,
      height: input.height ?? null,
      recorded_on: input.recorded_on ?? undefined,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as StudentProgress;
}

// ============================================================
// Histórico de cargas por exercício (migration 006)
// ============================================================

/** Séries registradas do aluno; `exerciseName` filtra um exercício específico. */
export async function listExerciseLogs(
  studentId: string,
  exerciseName?: string
): Promise<ExerciseLog[]> {
  const trainerId = await requireUserId();
  let query = supabase
    .from('exercise_logs')
    .select('*')
    .eq('trainer_id', trainerId)
    .eq('student_id', studentId);

  if (exerciseName) query = query.eq('exercise_name', exerciseName);

  const { data, error } = await query.order('performed_on', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ExerciseLog[];
}

export type ExerciseLogInput = {
  student_id: string;
  exercise_name: string;
  workout_exercise_id?: string | null;
  exercise_id?: string | null;
  performed_on?: string; // YYYY-MM-DD (default: hoje, no banco)
  set_number?: number;
  reps?: number | null;
  weight_kg?: number | null;
  notes?: string | null;
};

/** Registra a carga/reps realizados numa série. */
export async function createExerciseLog(input: ExerciseLogInput): Promise<ExerciseLog> {
  const trainerId = await requireUserId();
  const { data, error } = await supabase
    .from('exercise_logs')
    .insert({
      trainer_id: trainerId,
      student_id: input.student_id,
      exercise_name: input.exercise_name,
      workout_exercise_id: input.workout_exercise_id ?? null,
      exercise_id: input.exercise_id ?? null,
      performed_on: input.performed_on ?? undefined,
      set_number: input.set_number ?? 1,
      reps: input.reps ?? null,
      weight_kg: input.weight_kg ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ExerciseLog;
}

// ============================================================
// Catálogo de exercícios e substitutos (migration 006)
// ============================================================

/** Catálogo do personal + exercícios globais (policy exercise_library_own_or_global). */
export async function listExercises(): Promise<ExerciseLibrary[]> {
  await requireUserId();
  const { data, error } = await supabase.from('exercise_library').select('*').order('name');

  if (error) throw new Error(error.message);
  return (data ?? []) as ExerciseLibrary[];
}

/** Cadastra um exercício no catálogo do personal. */
export async function createExercise(input: {
  name: string;
  muscle_group?: string | null;
  equipment?: string | null;
}): Promise<ExerciseLibrary> {
  const trainerId = await requireUserId();
  const { data, error } = await supabase
    .from('exercise_library')
    .insert({
      trainer_id: trainerId,
      name: input.name,
      muscle_group: input.muscle_group ?? null,
      equipment: input.equipment ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ExerciseLibrary;
}

/** Alternativas cadastradas para um exercício (ex.: máquina ocupada). */
export async function listSubstitutes(exerciseId: string): Promise<ExerciseSubstitute[]> {
  await requireUserId();
  const { data, error } = await supabase
    .from('exercise_substitutes')
    .select(
      '*, substitute:exercise_library!exercise_substitutes_substitute_id_fkey(id, name, equipment, muscle_group)'
    )
    .eq('exercise_id', exerciseId);

  if (error) throw new Error(error.message);
  return (data ?? []) as ExerciseSubstitute[];
}

/**
 * Substitutos a partir do NOME do exercício — os treinos antigos guardam
 * exercise_name solto, sem FK para o catálogo (ver seção 0 da migration 006).
 * Sem correspondência no catálogo, devolve lista vazia.
 */
export async function listSubstitutesByName(name: string): Promise<ExerciseSubstitute[]> {
  await requireUserId();
  const { data, error } = await supabase
    .from('exercise_library')
    .select('id')
    .ilike('name', name)
    .limit(1);

  if (error) throw new Error(error.message);
  const match = (data ?? [])[0] as { id: string } | undefined;
  return match ? listSubstitutes(match.id) : [];
}

/** Relação estática (sem IA): exercício X pode ser trocado por Y. */
export async function addSubstitute(
  exerciseId: string,
  substituteId: string,
  reason?: string | null
): Promise<void> {
  const trainerId = await requireUserId();
  if (exerciseId === substituteId) {
    throw new Error('Um exercício não pode ser substituto de si mesmo.');
  }
  const { error } = await supabase.from('exercise_substitutes').insert({
    exercise_id: exerciseId,
    substitute_id: substituteId,
    trainer_id: trainerId,
    reason: reason ?? null,
  });

  if (error) {
    // 23505 = unique_violation (a relação já existe).
    if (error.code === '23505') throw new Error('Esse substituto já está cadastrado.');
    throw new Error(error.message);
  }
}

export async function removeSubstitute(exerciseId: string, substituteId: string): Promise<void> {
  const trainerId = await requireUserId();
  const { error } = await supabase
    .from('exercise_substitutes')
    .delete()
    .eq('trainer_id', trainerId)
    .eq('exercise_id', exerciseId)
    .eq('substitute_id', substituteId);

  if (error) throw new Error(error.message);
}

// ============================================================
// Produtividade do personal (métricas internas, sem tabela nova)
// ============================================================

export type ProductivityData = {
  workouts: { created_at: string }[];
  sessions: { starts_at: string; ends_at: string }[];
};

/**
 * Matéria-prima do dashboard de produtividade: treinos montados e aulas dadas
 * nos últimos `months` meses. A agregação semanal/mensal é feita no cliente
 * (lib/produtividade.ts), sem dependência externa.
 */
export async function getProductivityData(months = 6): Promise<ProductivityData> {
  const trainerId = await requireUserId();
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);
  const sinceIso = since.toISOString();

  const [workoutsResult, sessionsResult] = await Promise.all([
    supabase
      .from('workouts')
      .select('created_at')
      .eq('trainer_id', trainerId)
      .gte('created_at', sinceIso),
    supabase
      .from('sessions')
      .select('starts_at, ends_at')
      .eq('trainer_id', trainerId)
      .gte('starts_at', sinceIso),
  ]);

  if (workoutsResult.error) throw new Error(workoutsResult.error.message);
  if (sessionsResult.error) throw new Error(sessionsResult.error.message);

  return {
    workouts: (workoutsResult.data ?? []) as { created_at: string }[],
    sessions: (sessionsResult.data ?? []) as { starts_at: string; ends_at: string }[],
  };
}

// ============================================================
// Comunidade - canal de avisos do admin (migration 006)
// ============================================================

/**
 * Mural de avisos. Para o personal comum a RLS já devolve só os publicados;
 * o admin enxerga também os rascunhos (published_at nulo).
 */
export async function listAnnouncements(): Promise<CommunityAnnouncement[]> {
  await requireUserId();
  const { data, error } = await supabase
    .from('community_announcements')
    .select('*')
    .order('pinned', { ascending: false })
    .order('published_at', { ascending: false, nullsFirst: true })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as CommunityAnnouncement[];
}

/** O usuário logado é admin do app? Define se a tela mostra o botão de publicar. */
export async function isAppAdmin(): Promise<boolean> {
  const trainerId = await requireUserId();
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', trainerId)
    .single();

  if (error) return false;
  return Boolean((data as { is_admin: boolean | null } | null)?.is_admin);
}

export type AnnouncementInput = {
  title: string;
  body: string;
  pinned?: boolean;
  /** false grava como rascunho (published_at nulo): ninguém além do admin vê. */
  publish?: boolean;
};

/** Publica um aviso. A RLS recusa se o autor não for admin. */
export async function createAnnouncement(
  input: AnnouncementInput
): Promise<CommunityAnnouncement> {
  const authorId = await requireUserId();
  const { data, error } = await supabase
    .from('community_announcements')
    .insert({
      author_id: authorId,
      title: input.title,
      body: input.body,
      pinned: input.pinned ?? false,
      published_at: input.publish === false ? null : new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    // 42501 = insufficient_privilege: a policy só deixa o admin escrever.
    if (error.code === '42501') throw new Error('Só o administrador publica avisos.');
    throw new Error(error.message);
  }
  return data as CommunityAnnouncement;
}
