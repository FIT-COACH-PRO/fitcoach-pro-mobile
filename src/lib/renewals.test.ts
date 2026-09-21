import {
  clampAlertDays,
  daysUntil,
  renewalStatus,
  renewalLabel,
  DEFAULT_RENEWAL_ALERT_DAYS,
} from './renewals';

const now = new Date(2026, 8, 20, 10, 0); // 20/09/2026

describe('clampAlertDays', () => {
  it('mantém a janela dentro de 1..90', () => {
    expect(clampAlertDays(15)).toBe(15);
    expect(clampAlertDays(0)).toBe(1);
    expect(clampAlertDays(200)).toBe(90);
    expect(clampAlertDays(7.4)).toBe(7);
  });
  it('cai no default quando não há valor', () => {
    expect(clampAlertDays(null)).toBe(DEFAULT_RENEWAL_ALERT_DAYS);
    expect(clampAlertDays(undefined)).toBe(DEFAULT_RENEWAL_ALERT_DAYS);
  });
});

describe('daysUntil', () => {
  it('conta dias sem escorregar por fuso', () => {
    expect(daysUntil('2026-09-20', now)).toBe(0);
    expect(daysUntil('2026-09-23', now)).toBe(3);
    expect(daysUntil('2026-09-18', now)).toBe(-2);
  });
});

describe('renewalStatus', () => {
  it('respeita a janela configurada pelo personal', () => {
    // Com 7 dias, vencimento em 10 dias ainda não alerta.
    expect(renewalStatus('2026-09-30', 7, now).kind).toBe('none');
    // Com 15 dias, o mesmo vencimento alerta.
    expect(renewalStatus('2026-09-30', 15, now).kind).toBe('due_soon');
  });

  it('distingue hoje, vencido e sem data', () => {
    expect(renewalStatus('2026-09-20', 7, now).kind).toBe('due_today');
    expect(renewalStatus('2026-09-18', 7, now)).toEqual({ kind: 'expired', days: -2 });
    expect(renewalStatus(null, 7, now)).toEqual({ kind: 'none', days: null });
  });

  it('vencido alerta mesmo fora da janela', () => {
    expect(renewalStatus('2026-01-01', 1, now).kind).toBe('expired');
  });
});

describe('renewalLabel', () => {
  it('descreve cada situação em pt-BR', () => {
    expect(renewalLabel(renewalStatus('2026-09-20', 7, now))).toBe('Vence hoje');
    expect(renewalLabel(renewalStatus('2026-09-21', 7, now))).toBe('Vence amanhã');
    expect(renewalLabel(renewalStatus('2026-09-23', 7, now))).toBe('Vence em 3 dias');
    expect(renewalLabel(renewalStatus('2026-09-19', 7, now))).toBe('Venceu ontem');
    expect(renewalLabel(renewalStatus('2026-09-18', 7, now))).toBe('Venceu há 2 dias');
    expect(renewalLabel(renewalStatus(null, 7, now))).toBeNull();
  });
});
