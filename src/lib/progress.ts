// Evolução do aluno: IMC, série temporal de peso/IMC e evolução de carga por
// exercício. Puro (sem React Native) para ser testável.

import type { StudentProgress, ExerciseLog } from '../types/extras';

/**
 * Altura chega em metros (1.68) ou centímetros (168), dependendo de onde foi
 * cadastrada. Normaliza para metros — mesma heurística já usada na tela de
 * detalhe do aluno e na coluna gerada `student_progress.bmi`.
 */
export function heightInMeters(height: number | null | undefined): number | null {
  if (height == null || !Number.isFinite(height) || height <= 0) return null;
  return height > 3 ? height / 100 : height;
}

/** IMC = peso / altura². Null se faltar peso ou altura. */
export function computeBmi(
  weightKg: number | null | undefined,
  height: number | null | undefined
): number | null {
  const m = heightInMeters(height);
  if (m == null || weightKg == null || !Number.isFinite(weightKg) || weightKg <= 0) return null;
  return weightKg / (m * m);
}

export type BmiBand = 'abaixo' | 'normal' | 'sobrepeso' | 'obesidade';

/** Faixa do IMC pela tabela da OMS. */
export function bmiBand(bmi: number | null): BmiBand | null {
  if (bmi == null || !Number.isFinite(bmi)) return null;
  if (bmi < 18.5) return 'abaixo';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'sobrepeso';
  return 'obesidade';
}

export const BMI_BAND_LABEL: Record<BmiBand, string> = {
  abaixo: 'Abaixo do peso',
  normal: 'Peso normal',
  sobrepeso: 'Sobrepeso',
  obesidade: 'Obesidade',
};

export type ProgressPoint = {
  /** YYYY-MM-DD */
  date: string;
  weight: number;
  bmi: number | null;
};

/** Snapshots em ordem cronológica (mais antigo primeiro), prontos para o gráfico. */
export function toProgressSeries(rows: StudentProgress[]): ProgressPoint[] {
  return [...rows]
    .sort((a, b) => a.recorded_on.localeCompare(b.recorded_on))
    .map((r) => ({
      date: r.recorded_on,
      weight: Number(r.weight),
      // O banco calcula o bmi; se vier nulo (altura ausente), tenta no cliente.
      bmi: r.bmi != null ? Number(r.bmi) : computeBmi(Number(r.weight), r.height),
    }));
}

export type ProgressDelta = { weight: number | null; bmi: number | null };

/** Diferença entre o primeiro e o último snapshot (negativo = perdeu peso). */
export function progressDelta(series: ProgressPoint[]): ProgressDelta {
  if (series.length < 2) return { weight: null, bmi: null };
  const first = series[0];
  const last = series[series.length - 1];
  return {
    weight: last.weight - first.weight,
    bmi: last.bmi != null && first.bmi != null ? last.bmi - first.bmi : null,
  };
}

/** "+2,4 kg" / "-1,8 kg" / "—" */
export function formatDelta(value: number | null, unit: string, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const rounded = Number(value.toFixed(digits));
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded.toFixed(digits).replace('.', ',')}${unit ? ` ${unit}` : ''}`;
}

export type LoadPoint = {
  /** YYYY-MM-DD */
  date: string;
  /** Maior carga registrada no dia. */
  topWeight: number;
  /** Repetições da série de maior carga. */
  reps: number | null;
  /** Volume do dia: soma de carga × reps de todas as séries. */
  volume: number;
  sets: number;
};

/**
 * Evolução de um exercício: uma entrada por data, agregando as séries do dia.
 * Séries sem carga registrada entram na contagem, mas não no volume.
 */
export function toLoadSeries(logs: ExerciseLog[]): LoadPoint[] {
  const byDate = new Map<string, LoadPoint>();

  for (const log of logs) {
    const weight = log.weight_kg != null ? Number(log.weight_kg) : 0;
    const reps = log.reps != null ? Number(log.reps) : null;
    const point = byDate.get(log.performed_on);

    if (!point) {
      byDate.set(log.performed_on, {
        date: log.performed_on,
        topWeight: weight,
        reps,
        volume: weight * (reps ?? 0),
        sets: 1,
      });
      continue;
    }

    point.sets += 1;
    point.volume += weight * (reps ?? 0);
    if (weight > point.topWeight) {
      point.topWeight = weight;
      point.reps = reps;
    }
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Nomes de exercício com histórico, em ordem alfabética e sem repetição. */
export function exerciseNamesFrom(logs: ExerciseLog[]): string[] {
  return [...new Set(logs.map((l) => l.exercise_name))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR')
  );
}

/** "20/09" a partir de "2026-09-20" (rótulo curto do eixo do gráfico). */
export function shortDate(iso: string): string {
  const [, mm, dd] = iso.slice(0, 10).split('-');
  return dd && mm ? `${dd}/${mm}` : iso;
}
