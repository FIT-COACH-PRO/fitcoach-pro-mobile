import {
  summarizeProductivity,
  weeklyBars,
  monthlyBars,
  hoursBetween,
  startOfWeek,
  formatHours,
} from './produtividade';

// Domingo 20/09/2026 é o começo da semana de quarta 23/09/2026.
const now = new Date(2026, 8, 23, 12, 0); // 23/09/2026, quarta

const at = (day: number, hour: number) => new Date(2026, 8, day, hour).toISOString();
const aula = (day: number, hour: number, durationH = 1) => ({
  starts_at: at(day, hour),
  ends_at: at(day, hour + durationH),
});

describe('startOfWeek', () => {
  it('volta para o domingo à meia-noite', () => {
    const start = startOfWeek(now);
    expect(start.getDate()).toBe(20);
    expect(start.getDay()).toBe(0);
    expect(start.getHours()).toBe(0);
  });
});

describe('hoursBetween', () => {
  it('converte o intervalo em horas decimais', () => {
    expect(hoursBetween(at(23, 8), at(23, 9))).toBe(1);
    expect(hoursBetween(new Date(2026, 8, 23, 8).toISOString(), new Date(2026, 8, 23, 9, 30).toISOString())).toBe(1.5);
  });
  it('ignora intervalo invertido ou inválido', () => {
    expect(hoursBetween(at(23, 9), at(23, 8))).toBe(0);
    expect(hoursBetween('nao-e-data', at(23, 9))).toBe(0);
  });
});

describe('summarizeProductivity', () => {
  const workouts = [
    { created_at: at(21, 10) }, // esta semana
    { created_at: at(8, 10) }, // mês, semana anterior
    { created_at: new Date(2026, 7, 30, 10).toISOString() }, // agosto
  ];
  const sessions = [
    aula(21, 8), // 1h — semana e mês
    aula(23, 7, 2), // 2h — semana e mês
    aula(8, 8), // 1h — só no mês
    { starts_at: new Date(2026, 7, 30, 8).toISOString(), ends_at: new Date(2026, 7, 30, 9).toISOString() },
  ];

  it('separa a semana corrente do mês corrente', () => {
    const s = summarizeProductivity(workouts, sessions, now);
    expect(s.week).toEqual({ workouts: 1, sessions: 2, hours: 3 });
    expect(s.month).toEqual({ workouts: 2, sessions: 3, hours: 4 });
  });

  it('sem dados, zera tudo', () => {
    expect(summarizeProductivity([], [], now).week).toEqual({ workouts: 0, sessions: 0, hours: 0 });
  });

  it('conta aula que começa hoje mais tarde', () => {
    const s = summarizeProductivity([], [aula(23, 18)], now);
    expect(s.week.sessions).toBe(1);
  });
});

describe('weeklyBars', () => {
  it('devolve N semanas, da mais antiga para a atual', () => {
    const bars = weeklyBars([{ created_at: at(21, 10) }], [aula(21, 8)], now, 3);
    expect(bars).toHaveLength(3);
    expect(bars[2].label).toBe('20/09'); // semana atual, por último
    expect(bars[2].hours).toBe(1);
    expect(bars[2].workouts).toBe(1);
    expect(bars[0].hours).toBe(0);
  });
});

describe('monthlyBars', () => {
  it('rotula os meses em pt-BR', () => {
    const bars = monthlyBars([], [aula(21, 8)], now, 2);
    expect(bars.map((b) => b.label)).toEqual(['ago', 'set']);
    expect(bars[1].hours).toBe(1);
  });
});

describe('formatHours', () => {
  it('formata horas e minutos', () => {
    expect(formatHours(0)).toBe('0h');
    expect(formatHours(3)).toBe('3h');
    expect(formatHours(12.5)).toBe('12h30');
    expect(formatHours(1.75)).toBe('1h45');
  });
});
