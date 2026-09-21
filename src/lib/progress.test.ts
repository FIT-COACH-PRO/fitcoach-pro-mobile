import {
  computeBmi,
  heightInMeters,
  bmiBand,
  toProgressSeries,
  progressDelta,
  formatDelta,
  toLoadSeries,
  exerciseNamesFrom,
  shortDate,
} from './progress';
import type { StudentProgress, ExerciseLog } from '../types/extras';

const snap = (p: Partial<StudentProgress>): StudentProgress => p as StudentProgress;
const log = (p: Partial<ExerciseLog>): ExerciseLog => p as ExerciseLog;

describe('heightInMeters', () => {
  it('aceita metros e centímetros', () => {
    expect(heightInMeters(1.68)).toBeCloseTo(1.68);
    expect(heightInMeters(168)).toBeCloseTo(1.68);
  });
  it('rejeita ausente ou não positiva', () => {
    expect(heightInMeters(null)).toBeNull();
    expect(heightInMeters(0)).toBeNull();
  });
});

describe('computeBmi', () => {
  it('calcula a partir de peso e altura', () => {
    expect(computeBmi(68, 1.68)).toBeCloseTo(24.09, 2);
    expect(computeBmi(68, 168)).toBeCloseTo(24.09, 2);
  });
  it('sem altura ou peso, não calcula', () => {
    expect(computeBmi(68, null)).toBeNull();
    expect(computeBmi(null, 1.68)).toBeNull();
  });
});

describe('bmiBand', () => {
  it('classifica pelas faixas da OMS', () => {
    expect(bmiBand(17)).toBe('abaixo');
    expect(bmiBand(24.1)).toBe('normal');
    expect(bmiBand(27.5)).toBe('sobrepeso');
    expect(bmiBand(31)).toBe('obesidade');
    expect(bmiBand(null)).toBeNull();
  });
});

describe('toProgressSeries', () => {
  it('ordena do mais antigo para o mais recente', () => {
    const series = toProgressSeries([
      snap({ recorded_on: '2026-09-10', weight: 70, bmi: 24.8, height: 1.68 }),
      snap({ recorded_on: '2026-08-10', weight: 72, bmi: 25.5, height: 1.68 }),
    ]);
    expect(series.map((p) => p.date)).toEqual(['2026-08-10', '2026-09-10']);
  });

  it('calcula o IMC no cliente quando o banco não devolveu', () => {
    const series = toProgressSeries([
      snap({ recorded_on: '2026-09-10', weight: 68, bmi: null, height: 168 }),
    ]);
    expect(series[0].bmi).toBeCloseTo(24.09, 2);
  });
});

describe('progressDelta', () => {
  it('compara o primeiro e o último snapshot', () => {
    const series = toProgressSeries([
      snap({ recorded_on: '2026-08-10', weight: 72, bmi: 25.5 }),
      snap({ recorded_on: '2026-09-10', weight: 70, bmi: 24.8 }),
    ]);
    const delta = progressDelta(series);
    expect(delta.weight).toBeCloseTo(-2);
    expect(delta.bmi).toBeCloseTo(-0.7, 5);
  });

  it('com menos de dois pontos não há variação', () => {
    expect(progressDelta([])).toEqual({ weight: null, bmi: null });
  });
});

describe('formatDelta', () => {
  it('mostra sinal e unidade', () => {
    expect(formatDelta(-2, 'kg')).toBe('-2,0 kg');
    expect(formatDelta(1.25, 'kg')).toBe('+1,3 kg');
    expect(formatDelta(null, 'kg')).toBe('—');
  });
});

describe('toLoadSeries', () => {
  it('agrega as séries do dia: maior carga e volume', () => {
    const series = toLoadSeries([
      log({ performed_on: '2026-09-10', set_number: 1, reps: 10, weight_kg: 60 }),
      log({ performed_on: '2026-09-10', set_number: 2, reps: 8, weight_kg: 70 }),
      log({ performed_on: '2026-09-17', set_number: 1, reps: 8, weight_kg: 75 }),
    ]);

    expect(series).toHaveLength(2);
    expect(series[0]).toEqual({
      date: '2026-09-10',
      topWeight: 70,
      reps: 8,
      volume: 60 * 10 + 70 * 8,
      sets: 2,
    });
    expect(series[1].topWeight).toBe(75);
  });

  it('série sem carga conta como set, mas não soma volume', () => {
    const series = toLoadSeries([
      log({ performed_on: '2026-09-10', set_number: 1, reps: 15, weight_kg: null }),
    ]);
    expect(series[0]).toMatchObject({ sets: 1, volume: 0, topWeight: 0 });
  });
});

describe('exerciseNamesFrom', () => {
  it('remove repetidos e ordena', () => {
    const names = exerciseNamesFrom([
      log({ exercise_name: 'Supino reto' }),
      log({ exercise_name: 'Agachamento' }),
      log({ exercise_name: 'Supino reto' }),
    ]);
    expect(names).toEqual(['Agachamento', 'Supino reto']);
  });
});

describe('shortDate', () => {
  it('encurta a data ISO', () => {
    expect(shortDate('2026-09-20')).toBe('20/09');
  });
});
