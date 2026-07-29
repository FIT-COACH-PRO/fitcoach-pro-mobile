import type { Payment } from '../types/database';

export type FinanceSummary = { receivedMonth: number; pending: number };

/**
 * Resumo financeiro a partir dos pagamentos: total pago com vencimento no mês
 * corrente ("Recebido no mês") e total ainda pendente (qualquer vencimento).
 */
export function computeSummary(list: Payment[], now: Date = new Date()): FinanceSummary {
  const y = now.getFullYear();
  const mo = now.getMonth();
  let receivedMonth = 0;
  let pending = 0;
  for (const p of list) {
    // Parse local (não UTC) para o mês não escorregar em datas de dia 1º.
    const [dy, dm] = p.due_date.slice(0, 10).split('-').map(Number);
    const inMonth = dy === y && dm - 1 === mo;
    if (p.status === 'paid' && inMonth) receivedMonth += p.amount;
    if (p.status === 'pending') pending += p.amount;
  }
  return { receivedMonth, pending };
}
