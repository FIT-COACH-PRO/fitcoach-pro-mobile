// Formatação pt-BR feita à mão de propósito: o suporte a Intl/ICU varia entre
// Hermes/Android e iOS, e a Home depende disso para renderizar sempre igual.

const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEKDAYS_LONG = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];
const MONTHS_LONG = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/** "Terça, 14 de julho de 2026" */
export function formatFullDate(date: Date): string {
  return `${WEEKDAYS_LONG[date.getDay()]}, ${date.getDate()} de ${
    MONTHS_LONG[date.getMonth()]
  } de ${date.getFullYear()}`;
}

/** "Bom dia" | "Boa tarde" | "Boa noite" */
export function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Data de vencimento em linguagem curta: "Hoje", "Amanhã", senão "Sex, 17/07".
 * `iso` é uma data sem fuso (YYYY-MM-DD) vinda do Postgres.
 */
export function formatDueDate(iso: string, now: Date = new Date()): string {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  const due = new Date(year, month - 1, day);

  const diffDays = Math.round(
    (due.getTime() - startOfDay(now).getTime()) / 86_400_000
  );
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Amanhã';

  const dd = String(due.getDate()).padStart(2, '0');
  const mm = String(due.getMonth() + 1).padStart(2, '0');
  return `${WEEKDAYS_SHORT[due.getDay()]}, ${dd}/${mm}`;
}

/** "R$ 220" — valores cheios, sem centavos quando são redondos. */
export function formatCurrency(value: number | null): string {
  if (value == null) return '—';
  const rounded = Math.round(value * 100) / 100;
  const isWhole = Number.isInteger(rounded);
  const [int, cents] = rounded.toFixed(isWhole ? 0 : 2).split('.');
  const withThousands = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return cents ? `R$ ${withThousands},${cents}` : `R$ ${withThousands}`;
}

/** "R$ 8,4k" — versão compacta para o card de receita. */
export function formatCurrencyCompact(value: number): string {
  if (value < 1000) return formatCurrency(value);
  const thousands = value / 1000;
  // 8400 -> "8,4k"; 12000 -> "12k"
  const text =
    thousands >= 100 || Number.isInteger(thousands)
      ? String(Math.round(thousands))
      : thousands.toFixed(1).replace('.', ',');
  return `R$ ${text}k`;
}
