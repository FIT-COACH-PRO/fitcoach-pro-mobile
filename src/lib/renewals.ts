// Alerta de vencimento da ficha/assinatura do aluno.
//
// O campo de vencimento é students.subscription_end (já existia). A janela de
// antecedência NÃO é fixa no código: vem de profiles.renewal_alert_days, que o
// personal ajusta em Configurações. DEFAULT_RENEWAL_ALERT_DAYS é só o valor
// inicial, igual ao default da coluna no banco.

export const DEFAULT_RENEWAL_ALERT_DAYS = 7;
export const MIN_RENEWAL_ALERT_DAYS = 1;
export const MAX_RENEWAL_ALERT_DAYS = 90;

/** Mantém a janela dentro do CHECK da coluna (1..90). */
export function clampAlertDays(days: number | null | undefined): number {
  if (days == null || !Number.isFinite(days)) return DEFAULT_RENEWAL_ALERT_DAYS;
  const int = Math.round(days);
  if (int < MIN_RENEWAL_ALERT_DAYS) return MIN_RENEWAL_ALERT_DAYS;
  if (int > MAX_RENEWAL_ALERT_DAYS) return MAX_RENEWAL_ALERT_DAYS;
  return int;
}

export type RenewalKind = 'none' | 'due_soon' | 'due_today' | 'expired';

export type RenewalStatus = {
  kind: RenewalKind;
  /** Dias até o vencimento; negativo se já venceu. null quando não há data. */
  days: number | null;
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Dias entre hoje e uma data ISO (YYYY-MM-DD), sem escorregar por fuso. */
export function daysUntil(iso: string, now: Date = new Date()): number | null {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d);
  return Math.round((target.getTime() - startOfDay(now).getTime()) / 86_400_000);
}

/**
 * Situação do vencimento dado a janela configurada pelo personal.
 * 'none' = sem data ou ainda fora da janela de alerta.
 */
export function renewalStatus(
  subscriptionEnd: string | null | undefined,
  alertDays: number = DEFAULT_RENEWAL_ALERT_DAYS,
  now: Date = new Date()
): RenewalStatus {
  if (!subscriptionEnd) return { kind: 'none', days: null };

  const days = daysUntil(subscriptionEnd, now);
  if (days == null) return { kind: 'none', days: null };

  const window = clampAlertDays(alertDays);
  if (days < 0) return { kind: 'expired', days };
  if (days === 0) return { kind: 'due_today', days };
  if (days <= window) return { kind: 'due_soon', days };
  return { kind: 'none', days };
}

/** Texto do alerta ("Vence em 3 dias", "Venceu há 2 dias"…). */
export function renewalLabel(status: RenewalStatus): string | null {
  const { kind, days } = status;
  if (kind === 'none' || days == null) return null;
  if (kind === 'due_today') return 'Vence hoje';
  if (kind === 'expired') {
    const late = Math.abs(days);
    return late === 1 ? 'Venceu ontem' : `Venceu há ${late} dias`;
  }
  return days === 1 ? 'Vence amanhã' : `Vence em ${days} dias`;
}
