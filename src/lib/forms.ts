// Parsers/formatadores de entrada usados pelos formulários. Puros de propósito
// (sem dependência de React Native) para serem testáveis e reutilizáveis.

export const pad = (n: number) => String(n).padStart(2, '0');

/** Data como "DD/MM/AAAA" (padrão: hoje). */
export function todayBR(now: Date = new Date()): string {
  return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
}

/** "DD/MM/AAAA" → "AAAA-MM-DD" (ISO). Retorna null se inválida. */
export function brToIso(br: string): string | null {
  const m = br.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const day = Number(dd);
  const month = Number(mm);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const iso = `${yyyy}-${mm}-${dd}`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return iso;
}

/** "DD/MM/AAAA" + "HH:MM" → Date no fuso local. Retorna null se inválido. */
export function toLocalDate(br: string, time: string): Date | null {
  const dm = br.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const tm = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!dm || !tm) return null;
  const [, dd, mm, yyyy] = dm;
  const [, hh, min] = tm;
  const day = Number(dd);
  const month = Number(mm);
  const hour = Number(hh);
  const minute = Number(min);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  const d = new Date(Number(yyyy), month - 1, day, hour, minute, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "R$ 1.200,50" / "220.5" → número. Retorna null se vazio/inválido. */
export function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Dois instantes caem no mesmo dia do calendário local? */
export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
