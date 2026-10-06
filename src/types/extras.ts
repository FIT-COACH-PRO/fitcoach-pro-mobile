/**
 * Tipos das tabelas criadas na migration 006 (programas, progresso, cargas,
 * substitutos e avisos da comunidade).
 *
 * Ficam aqui e não em `database.ts` porque aquele arquivo é gerado pelo
 * `npm run sync-types` a partir do fitcoach-pro (web) e é sobrescrito a cada
 * sync. Quando o web incorporar a 006, mova estes tipos para lá e apague este
 * arquivo.
 */

import type { Profile, Session, Student, Workout } from './database';

/** Colunas que a 006 acrescentou a tabelas já existentes em `database.ts`. */
export type ProfileWithSettings = Profile & { renewal_alert_days: number };
export type SessionWithModalidade = Session & { modalidade: SessionModalidade | null };

export type Program = {
  id: string;
  trainer_id: string;
  name: string;
  description: string | null;
  duration_weeks: number | null;
  created_at: string;
  updated_at: string;
  program_workouts?: ProgramWorkout[];
};

export type ProgramWorkout = {
  id: string;
  program_id: string;
  workout_id: string;
  position: number;
  weekday: number;
  workout_label: string | null;
  notes: string | null;
  created_at: string;
  workout?: Workout;
};

/** Snapshot de peso/IMC. Cada atualização é uma linha nova (nunca sobrescreve). */
export type StudentProgress = {
  id: string;
  student_id: string;
  trainer_id: string;
  recorded_on: string; // YYYY-MM-DD
  weight: number;
  height: number | null;
  /** Coluna gerada no banco a partir de peso + altura. */
  bmi: number | null;
  notes: string | null;
  created_at: string;
};

/** Uma série executada de um exercício, por data. */
export type ExerciseLog = {
  id: string;
  trainer_id: string;
  student_id: string;
  workout_exercise_id: string | null;
  exercise_id: string | null;
  exercise_name: string;
  performed_on: string; // YYYY-MM-DD
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  notes: string | null;
  created_at: string;
  student?: Student;
};

export type ExerciseSubstitute = {
  exercise_id: string;
  substitute_id: string;
  trainer_id: string | null;
  reason: string | null;
  created_at: string;
  /** Vem do join com exercise_library na consulta de substitutos. */
  substitute?: { id: string; name: string; equipment: string | null; muscle_group: string | null };
};

export type CommunityAnnouncement = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  pinned: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Modalidade da aula — só presencial x presencial gera conflito de horário. */
export type SessionModalidade = 'presencial' | 'online';
