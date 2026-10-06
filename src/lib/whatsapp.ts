// Gerador de mensagem pronta para o personal copiar/enviar no WhatsApp.
// Não é envio automático nem integração com API de mensageria: a função monta
// o texto e o link wa.me; quem dispara é o personal, no app dele.
// Puro de propósito (sem React Native) para ser testável.

const DDI_BR = '55';

/**
 * Normaliza um número brasileiro para o formato do wa.me (DDI + DDD + número).
 * Aceita "(11) 98888-1234", "11988881234" ou já com DDI ("5511988881234").
 * Retorna null se não sobrar um número plausível.
 */
export function toWhatsAppNumber(raw: string | null | undefined): string | null {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (!digits) return null;
  // 10 dígitos = fixo com DDD, 11 = celular com DDD.
  if (digits.length === 10 || digits.length === 11) return DDI_BR + digits;
  // 12/13 dígitos já vêm com DDI; só aceita se for o do Brasil.
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith(DDI_BR)) return digits;
  return null;
}

/** Link wa.me com o texto pré-preenchido; null se o número for inválido. */
export function waMeLink(phone: string | null | undefined, message: string): string | null {
  const number = toWhatsAppNumber(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export type MessageExercise = {
  name: string;
  /** Rótulo já formatado, ex.: "4 x 8" (ver format.setsLabel). */
  sets?: string;
  /** Carga prescrita, ex.: "80 kg". "—" e vazio são ignorados. */
  load?: string;
};

export type WorkoutMessageInput = {
  studentName: string;
  workoutName: string;
  /** Rótulo do dia, ex.: "Treino A". */
  dayLabel?: string;
  exercises?: MessageExercise[];
  /** Horário da aula, ex.: "08:00". */
  time?: string;
  /** Data em DD/MM, ex.: "20/09". */
  date?: string;
  place?: string;
  trainerName?: string;
};

const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? '';

const hasLoad = (load?: string) => !!load && load.trim() !== '' && load.trim() !== '—';

/**
 * Texto do treino do dia. Formato pensado para ser lido no celular: saudação,
 * quando/onde, lista dos exercícios e assinatura.
 */
export function buildWorkoutMessage(input: WorkoutMessageInput): string {
  const lines: string[] = [];

  lines.push(`Oi, ${firstName(input.studentName)}! 💪`);

  const when = [input.date, input.time && `às ${input.time}`].filter(Boolean).join(' ');
  const header = input.dayLabel ? `${input.workoutName} — ${input.dayLabel}` : input.workoutName;
  lines.push('', `Treino de hoje: ${header}`);
  if (when) lines.push(`Quando: ${when}`);
  if (input.place) lines.push(`Onde: ${input.place}`);

  const exercises = input.exercises ?? [];
  if (exercises.length > 0) {
    lines.push('');
    for (const ex of exercises) {
      const parts = [ex.name];
      if (ex.sets) parts.push(ex.sets);
      if (hasLoad(ex.load)) parts.push(`${ex.load}`);
      lines.push(`• ${parts.join(' — ')}`);
    }
  }

  lines.push('', 'Qualquer dúvida na execução é só chamar.');
  if (input.trainerName) lines.push(`— ${firstName(input.trainerName)}`);

  return lines.join('\n');
}

export type SessionMessageInput = {
  studentName: string;
  /** "20/09" */
  date: string;
  /** "08:00" */
  time: string;
  durationMin?: number;
  modalidade?: 'presencial' | 'online';
  place?: string;
  trainerName?: string;
};

/** Texto curto de confirmação/lembrete de aula. */
export function buildSessionMessage(input: SessionMessageInput): string {
  const lines: string[] = [];
  lines.push(`Oi, ${firstName(input.studentName)}!`);
  lines.push('');

  const modalidade = input.modalidade === 'online' ? 'aula online' : 'aula';
  const duracao = input.durationMin ? ` (${input.durationMin} min)` : '';
  lines.push(`Confirmando nossa ${modalidade} em ${input.date} às ${input.time}${duracao}.`);

  if (input.modalidade !== 'online' && input.place) lines.push(`Local: ${input.place}`);
  lines.push('', 'Pode confirmar por aqui?');
  if (input.trainerName) lines.push(`— ${firstName(input.trainerName)}`);

  return lines.join('\n');
}
