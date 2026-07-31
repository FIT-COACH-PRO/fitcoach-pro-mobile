import {
  formatCurrency,
  formatCurrencyCompact,
  formatDueDate,
  formatFullDate,
  greeting,
  formatVenc,
  ageFrom,
  setsLabel,
  formatTimeAgo,
} from './format';

describe('formatCurrency', () => {
  it('mostra valores redondos sem centavos', () => {
    expect(formatCurrency(220)).toBe('R$ 220');
    expect(formatCurrency(8400)).toBe('R$ 8.400');
  });
  it('mostra centavos quando há', () => {
    expect(formatCurrency(1200.5)).toBe('R$ 1.200,50');
    expect(formatCurrency(80.9)).toBe('R$ 80,90');
  });
  it('trata null', () => {
    expect(formatCurrency(null)).toBe('—');
  });
});

describe('formatCurrencyCompact', () => {
  it('compacta milhares', () => {
    expect(formatCurrencyCompact(8400)).toBe('R$ 8,4k');
    expect(formatCurrencyCompact(12000)).toBe('R$ 12k');
    expect(formatCurrencyCompact(150000)).toBe('R$ 150k');
  });
  it('abaixo de mil usa o formato cheio', () => {
    expect(formatCurrencyCompact(500)).toBe('R$ 500');
  });
});

describe('formatDueDate', () => {
  const now = new Date(2026, 6, 14); // terça, 14/07/2026
  it('reconhece hoje e amanhã', () => {
    expect(formatDueDate('2026-07-14', now)).toBe('Hoje');
    expect(formatDueDate('2026-07-15', now)).toBe('Amanhã');
  });
  it('demais datas viram "Dia, DD/MM"', () => {
    expect(formatDueDate('2026-07-17', now)).toMatch(/^\w{3}, 17\/07$/);
  });
});

describe('formatFullDate', () => {
  it('escreve a data por extenso em pt-BR', () => {
    const out = formatFullDate(new Date(2026, 6, 14));
    expect(out).toContain('14 de julho de 2026');
    expect(out).toMatch(/^(Domingo|Segunda|Terça|Quarta|Quinta|Sexta|Sábado),/);
  });
});

describe('greeting', () => {
  it('varia com a hora', () => {
    expect(greeting(new Date(2026, 0, 1, 9))).toBe('Bom dia');
    expect(greeting(new Date(2026, 0, 1, 14))).toBe('Boa tarde');
    expect(greeting(new Date(2026, 0, 1, 20))).toBe('Boa noite');
  });
});

describe('formatVenc', () => {
  it('rótulo curto de vencimento', () => {
    expect(formatVenc('2026-07-15')).toBe('Venc. 15/07');
  });
});

describe('ageFrom', () => {
  const now = new Date(2026, 6, 14);
  it('calcula a idade', () => {
    expect(ageFrom('2000-07-14', now)).toBe(26);
    expect(ageFrom('2000-07-15', now)).toBe(25); // aniversário ainda não chegou
  });
  it('trata ausente/inválida', () => {
    expect(ageFrom(null, now)).toBeUndefined();
    expect(ageFrom('não-é-data', now)).toBeUndefined();
  });
});

describe('formatTimeAgo', () => {
  const now = new Date(2026, 6, 14, 12, 0, 0); // terça, 14/07/2026 12:00

  it('menos de 1 minuto vira "agora"', () => {
    const iso = new Date(2026, 6, 14, 11, 59, 40).toISOString();
    expect(formatTimeAgo(iso, now)).toBe('agora');
  });
  it('minutos', () => {
    const iso = new Date(2026, 6, 14, 11, 45, 0).toISOString();
    expect(formatTimeAgo(iso, now)).toBe('há 15min');
  });
  it('horas', () => {
    const iso = new Date(2026, 6, 14, 9, 0, 0).toISOString();
    expect(formatTimeAgo(iso, now)).toBe('há 3h');
  });
  it('ontem (dia de calendário anterior, mesmo com menos de 24h)', () => {
    const iso = new Date(2026, 6, 13, 23, 0, 0).toISOString();
    expect(formatTimeAgo(iso, now)).toBe('ontem');
  });
  it('mais antigo vira DD/MM', () => {
    const iso = new Date(2026, 6, 10, 8, 0, 0).toISOString();
    expect(formatTimeAgo(iso, now)).toBe('10/07');
  });
});

describe('setsLabel', () => {
  it('monta séries × reps', () => {
    expect(setsLabel(4, '8')).toBe('4 x 8');
    expect(setsLabel(4, null)).toBe('4');
    expect(setsLabel(null, '8-12')).toBe('8-12');
    expect(setsLabel(null, null)).toBe('—');
  });
});
