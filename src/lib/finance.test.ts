import { computeSummary } from './finance';
import type { Payment } from '../types/database';

const pay = (p: Partial<Payment>): Payment => p as Payment;

describe('computeSummary', () => {
  const now = new Date(2026, 6, 15); // julho/2026

  it('soma pagos do mês em "recebido" e pendentes em "pendente"', () => {
    const list = [
      pay({ status: 'paid', amount: 220, due_date: '2026-07-10' }),
      pay({ status: 'paid', amount: 100, due_date: '2026-06-10' }), // outro mês
      pay({ status: 'pending', amount: 180, due_date: '2026-07-20' }),
      pay({ status: 'overdue', amount: 250, due_date: '2026-07-01' }),
    ];
    expect(computeSummary(list, now)).toEqual({ receivedMonth: 220, pending: 180 });
  });

  it('conta o dia 1º no mês certo (sem escorregar por fuso)', () => {
    const list = [pay({ status: 'paid', amount: 300, due_date: '2026-07-01' })];
    expect(computeSummary(list, now)).toEqual({ receivedMonth: 300, pending: 0 });
  });

  it('lista vazia zera o resumo', () => {
    expect(computeSummary([], now)).toEqual({ receivedMonth: 0, pending: 0 });
  });
});
