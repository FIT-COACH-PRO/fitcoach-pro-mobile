import { pad, todayBR, brToIso, isoToBr, toLocalDate, parseMoney, sameDay, maskWhatsapp } from './forms';

describe('pad', () => {
  it('preenche com zero à esquerda', () => {
    expect(pad(3)).toBe('03');
    expect(pad(12)).toBe('12');
  });
});

describe('todayBR', () => {
  it('formata a data como DD/MM/AAAA', () => {
    expect(todayBR(new Date(2026, 6, 5))).toBe('05/07/2026');
  });
});

describe('brToIso', () => {
  it('converte data válida', () => {
    expect(brToIso('14/07/2026')).toBe('2026-07-14');
    expect(brToIso('  01/12/2025  ')).toBe('2025-12-01');
  });
  it('rejeita formato inválido', () => {
    expect(brToIso('')).toBeNull();
    expect(brToIso('14-07-2026')).toBeNull();
    expect(brToIso('7/7/26')).toBeNull();
    expect(brToIso('abc')).toBeNull();
  });
  it('rejeita mês/dia fora do intervalo', () => {
    expect(brToIso('14/13/2026')).toBeNull();
    expect(brToIso('32/07/2026')).toBeNull();
    expect(brToIso('00/07/2026')).toBeNull();
  });
});

describe('isoToBr', () => {
  it('converte ISO para DD/MM/AAAA', () => {
    expect(isoToBr('2026-07-14')).toBe('14/07/2026');
    expect(isoToBr('2026-07-14T00:00:00.000Z')).toBe('14/07/2026');
  });
  it('retorna string vazia para nulo/vazio/inválido', () => {
    expect(isoToBr(null)).toBe('');
    expect(isoToBr(undefined)).toBe('');
    expect(isoToBr('')).toBe('');
    expect(isoToBr('abc')).toBe('');
  });
});

describe('toLocalDate', () => {
  it('monta um Date local a partir de data + hora', () => {
    const d = toLocalDate('14/07/2026', '08:30');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(6); // julho = 6
    expect(d!.getDate()).toBe(14);
    expect(d!.getHours()).toBe(8);
    expect(d!.getMinutes()).toBe(30);
  });
  it('rejeita data ou hora inválidas', () => {
    expect(toLocalDate('14/07/2026', '25:00')).toBeNull();
    expect(toLocalDate('14/07/2026', '08:70')).toBeNull();
    expect(toLocalDate('99/07/2026', '08:00')).toBeNull();
    expect(toLocalDate('', '08:00')).toBeNull();
  });
});

describe('parseMoney', () => {
  it('interpreta valores pt-BR (vírgula decimal, ponto milhar)', () => {
    expect(parseMoney('220')).toBe(220);
    expect(parseMoney('80,90')).toBe(80.9);
    expect(parseMoney('1.200,50')).toBe(1200.5);
    expect(parseMoney('R$ 1.200')).toBe(1200);
  });
  it('retorna null para vazio ou lixo', () => {
    expect(parseMoney('')).toBeNull();
    expect(parseMoney('abc')).toBeNull();
    expect(parseMoney('R$ ')).toBeNull();
  });
});

describe('maskWhatsapp', () => {
  it('aplica a máscara progressivamente enquanto digita', () => {
    expect(maskWhatsapp('1')).toBe('(1');
    expect(maskWhatsapp('11')).toBe('(11');
    expect(maskWhatsapp('119')).toBe('(11) 9');
    expect(maskWhatsapp('11999999999')).toBe('(11) 99999-9999');
  });
  it('ignora caracteres não numéricos e limita a 11 dígitos', () => {
    expect(maskWhatsapp('(11) 99999-9999')).toBe('(11) 99999-9999');
    expect(maskWhatsapp('11999999999999')).toBe('(11) 99999-9999');
  });
  it('string vazia permanece vazia', () => {
    expect(maskWhatsapp('')).toBe('');
  });
});

describe('sameDay', () => {
  it('compara apenas ano/mês/dia', () => {
    expect(sameDay(new Date(2026, 6, 14, 8), new Date(2026, 6, 14, 23))).toBe(true);
    expect(sameDay(new Date(2026, 6, 14), new Date(2026, 6, 15))).toBe(false);
    expect(sameDay(new Date(2026, 6, 14), new Date(2025, 6, 14))).toBe(false);
  });
});
