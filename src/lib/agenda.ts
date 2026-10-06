// Regra de conflito de horário da agenda.
//
// Aula "online" não gera conflito: nem com outra online, nem com presencial.
// Só duas presenciais disputam o mesmo horário (o personal não se divide entre
// dois lugares). A mesma regra existe no banco como constraint EXCLUDE parcial
// (migration 006); aqui ela roda antes de salvar, para o erro sair em português
// e apontar qual aula conflita.

import type { SessionModalidade } from '../types/extras';

export type ScheduledSession = {
  id: string;
  starts_at: string; // ISO
  ends_at: string; // ISO
  modalidade?: SessionModalidade | null;
  student?: { full_name: string } | null;
};

export type SessionWindow = {
  starts_at: string;
  ends_at: string;
  modalidade: SessionModalidade;
};

/** Sessões antigas (anteriores à 006) não têm modalidade: valem como presencial. */
export function modalidadeOf(s: { modalidade?: SessionModalidade | null }): SessionModalidade {
  return s.modalidade === 'online' ? 'online' : 'presencial';
}

/** Intervalos abertos no fim: 08:00–09:00 e 09:00–10:00 não se sobrepõem. */
export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Primeira aula presencial que colide com a janela candidata, ou null.
 * `ignoreId` permite reagendar a própria aula sem que ela conflite consigo.
 */
export function findSessionConflict(
  candidate: SessionWindow,
  existing: ScheduledSession[],
  ignoreId?: string
): ScheduledSession | null {
  if (candidate.modalidade === 'online') return null;

  const start = new Date(candidate.starts_at).getTime();
  const end = new Date(candidate.ends_at).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;

  for (const s of existing) {
    if (s.id === ignoreId) continue;
    if (modalidadeOf(s) !== 'presencial') continue;
    const sStart = new Date(s.starts_at).getTime();
    const sEnd = new Date(s.ends_at).getTime();
    if (!Number.isFinite(sStart) || !Number.isFinite(sEnd)) continue;
    if (overlaps(start, end, sStart, sEnd)) return s;
  }
  return null;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** "08:00–09:00 com Ana Paula" — mensagem de erro do conflito. */
export function describeConflict(session: ScheduledSession): string {
  const start = new Date(session.starts_at);
  const end = new Date(session.ends_at);
  const range = `${pad2(start.getHours())}:${pad2(start.getMinutes())}–${pad2(
    end.getHours()
  )}:${pad2(end.getMinutes())}`;
  const name = session.student?.full_name;
  return name ? `${range} com ${name}` : range;
}

export const MODALIDADE_LABEL: Record<SessionModalidade, string> = {
  presencial: 'Presencial',
  online: 'Online',
};
