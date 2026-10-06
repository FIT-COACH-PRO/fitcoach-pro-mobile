// Métricas de produtividade do personal: quantos treinos montou e quantas horas
// de aula deu, na semana e no mês. Tudo derivado do que já existe no banco
// (workouts.created_at e sessions.starts_at/ends_at) — sem serviço externo.

export type WorkoutStamp = { created_at: string };
export type SessionStamp = { starts_at: string; ends_at: string };

export type ProductivityPeriod = {
  /** Treinos montados no período. */
  workouts: number;
  /** Aulas dadas/agendadas no período. */
  sessions: number;
  /** Horas de aula somadas (decimal). */
  hours: number;
};

export type ProductivitySummary = {
  week: ProductivityPeriod;
  month: ProductivityPeriod;
};

/** Domingo 00:00 da semana de `now` (a Agenda usa a mesma régua: domingo→sábado). */
export function startOfWeek(now: Date): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function startOfMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** Duração em horas entre dois instantes ISO; 0 se inválido ou negativo. */
export function hoursBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return (end - start) / 3_600_000;
}

function inRange(iso: string, from: Date, to: Date): boolean {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && t >= from.getTime() && t < to.getTime();
}

function period(
  workouts: WorkoutStamp[],
  sessions: SessionStamp[],
  from: Date,
  to: Date
): ProductivityPeriod {
  const inPeriod = sessions.filter((s) => inRange(s.starts_at, from, to));
  return {
    workouts: workouts.filter((w) => inRange(w.created_at, from, to)).length,
    sessions: inPeriod.length,
    hours: inPeriod.reduce((sum, s) => sum + hoursBetween(s.starts_at, s.ends_at), 0),
  };
}

/** Resumo semanal + mensal. O fim do intervalo é o começo do dia seguinte a hoje. */
export function summarizeProductivity(
  workouts: WorkoutStamp[],
  sessions: SessionStamp[],
  now: Date = new Date()
): ProductivitySummary {
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return {
    week: period(workouts, sessions, startOfWeek(now), endOfToday),
    month: period(workouts, sessions, startOfMonth(now), endOfToday),
  };
}

export type ProductivityBar = {
  /** Rótulo curto do eixo, ex.: "08/09". */
  label: string;
  hours: number;
  workouts: number;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Últimas `count` semanas (a atual inclusa), da mais antiga para a mais recente
 * — o formato que o gráfico de barras consome.
 */
export function weeklyBars(
  workouts: WorkoutStamp[],
  sessions: SessionStamp[],
  now: Date = new Date(),
  count = 6
): ProductivityBar[] {
  const current = startOfWeek(now);
  const bars: ProductivityBar[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const from = new Date(current);
    from.setDate(from.getDate() - i * 7);
    const to = new Date(from);
    to.setDate(to.getDate() + 7);

    const p = period(workouts, sessions, from, to);
    bars.push({
      label: `${pad2(from.getDate())}/${pad2(from.getMonth() + 1)}`,
      hours: p.hours,
      workouts: p.workouts,
    });
  }
  return bars;
}

/** Meses recentes, da mais antiga para a mais recente. */
export function monthlyBars(
  workouts: WorkoutStamp[],
  sessions: SessionStamp[],
  now: Date = new Date(),
  count = 6
): ProductivityBar[] {
  const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const bars: ProductivityBar[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const p = period(workouts, sessions, from, to);
    bars.push({ label: MONTHS[from.getMonth()], hours: p.hours, workouts: p.workouts });
  }
  return bars;
}

/** "12h30" — horas decimais em formato legível. */
export function formatHours(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '0h';
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h}h` : `${h}h${pad2(m)}`;
}
