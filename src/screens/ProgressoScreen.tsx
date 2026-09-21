import { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Text, TextInput, TouchableRipple, ActivityIndicator, Icon } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader, Card, EmptyState, ErrorState, StatusBadge, type Tone } from '../components/ui';
import { BarChart } from '../components/BarChart';
import { useAppTheme, spacing, radius, fontSize, touch } from '../theme';
import { listStudentProgress, createStudentProgress, getStudent } from '../api/endpoints';
import {
  toProgressSeries,
  progressDelta,
  formatDelta,
  bmiBand,
  BMI_BAND_LABEL,
  shortDate,
  type BmiBand,
} from '../lib/progress';
import { parseMoney } from '../lib/forms';
import type { StudentProgress } from '../types/extras';
import type { AlunosStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AlunosStackParamList, 'AlunoProgresso'>;

const BAND_TONE: Record<BmiBand, Tone> = {
  abaixo: 'warning',
  normal: 'success',
  sobrepeso: 'warning',
  obesidade: 'danger',
};

/**
 * Histórico de progresso do aluno: cada registro é um snapshot novo
 * (student_progress), nunca uma sobrescrita — é isso que permite o gráfico de
 * evolução. O IMC vem calculado do banco (coluna gerada) a partir de peso +
 * altura.
 */
export function ProgressoScreen({ route, navigation }: Props) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { studentId, studentName } = route.params;

  const [rows, setRows] = useState<StudentProgress[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [list, student] = await Promise.all([listStudentProgress(studentId), getStudent(studentId).catch(() => null)]);
      setRows(list);
      setError(null);
      // Sugere a última altura conhecida: o personal só precisa digitar o peso.
      const lastHeight = list.find((r) => r.height != null)?.height ?? student?.height ?? null;
      if (lastHeight != null) setHeight((h) => h || String(lastHeight));
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : 'Não foi possível carregar o histórico.');
    }
  }, [studentId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const series = useMemo(() => toProgressSeries(rows ?? []), [rows]);
  const delta = useMemo(() => progressDelta(series), [series]);
  const last = series.length > 0 ? series[series.length - 1] : null;
  const band = bmiBand(last?.bmi ?? null);

  const save = async () => {
    const kg = parseMoney(weight); // mesmo parser de número com vírgula
    if (kg == null || kg <= 0) return setError('Informe um peso válido (ex.: 68,5).');
    const cmOrM = height.trim() ? parseMoney(height) : null;

    setSaving(true);
    setError(null);
    try {
      await createStudentProgress({ student_id: studentId, weight: kg, height: cmOrM });
      setWeight('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar o registro.');
    } finally {
      setSaving(false);
    }
  };

  if (rows === null) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: tokens.surface.page }]}>
        <ActivityIndicator color={tokens.accent.base} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: tokens.surface.page }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top + spacing.lg }}>
        <ScreenHeader title="Progresso" subtitle={studentName} onBack={navigation.goBack} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error && <ErrorState message={error} />}

        <View style={styles.statsRow}>
          <Stat value={last ? `${last.weight} kg` : '—'} label="Peso atual" />
          <Stat value={last?.bmi != null ? last.bmi.toFixed(1) : '—'} label="IMC" />
          <Stat value={formatDelta(delta.weight, 'kg')} label="Variação" />
        </View>

        {band && (
          <View style={styles.bandRow}>
            <StatusBadge label={BMI_BAND_LABEL[band]} tone={BAND_TONE[band]} />
            <Text style={[styles.bandHint, { color: tokens.text.secondary }]}>
              {series.length} registro{series.length === 1 ? '' : 's'} no histórico
            </Text>
          </View>
        )}

        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: tokens.text.primary }]}>Evolução do peso</Text>
          <BarChart
            data={series.slice(-8).map((p) => ({
              label: shortDate(p.date),
              value: p.weight,
              display: String(p.weight),
            }))}
            // Peso varia pouco perto de um valor alto: escala relativa.
            relative
            color={tokens.accent.base}
            emptyLabel="Registre pelo menos um peso para ver a evolução."
          />
        </Card>

        {series.some((p) => p.bmi != null) && (
          <Card style={styles.chartCard}>
            <Text style={[styles.chartTitle, { color: tokens.text.primary }]}>Evolução do IMC</Text>
            <BarChart
              data={series
                .slice(-8)
                .filter((p) => p.bmi != null)
                .map((p) => ({
                  label: shortDate(p.date),
                  value: p.bmi as number,
                  display: (p.bmi as number).toFixed(1),
                }))}
              relative
              color={tokens.success.base}
            />
          </Card>
        )}

        <Card style={styles.formCard}>
          <Text style={[styles.chartTitle, { color: tokens.text.primary }]}>Novo registro</Text>
          <Text style={[styles.formHint, { color: tokens.text.secondary }]}>
            Cada registro entra como uma linha nova — o anterior continua no histórico.
          </Text>
          <View style={styles.row}>
            <TextInput
              label="Peso (kg) *"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              mode="outlined"
              style={[styles.input, styles.rowItem]}
            />
            <TextInput
              label="Altura (m ou cm)"
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
              mode="outlined"
              style={[styles.input, styles.rowItem]}
            />
          </View>
          <TouchableRipple
            onPress={save}
            disabled={saving}
            style={[styles.submit, { backgroundColor: tokens.accent.base, opacity: saving ? 0.7 : 1 }]}
            borderless
          >
            <Text style={[styles.submitText, { color: tokens.text.onAccent }]}>
              {saving ? 'Salvando…' : 'Registrar'}
            </Text>
          </TouchableRipple>
        </Card>

        <Text style={[styles.sectionTitle, { color: tokens.text.primary }]}>Histórico</Text>
        {rows.length === 0 ? (
          <EmptyState icon="chart-line" title="Sem registros" subtitle="Nenhum peso registrado ainda." />
        ) : (
          rows.map((r) => <HistoryRow key={r.id} row={r} />)
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const { tokens } = useAppTheme();
  return (
    <View style={[styles.stat, { backgroundColor: tokens.surface.card }]}>
      <Text style={[styles.statValue, { color: tokens.text.primary }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: tokens.text.secondary }]}>{label}</Text>
    </View>
  );
}

function HistoryRow({ row }: { row: StudentProgress }) {
  const { tokens } = useAppTheme();
  return (
    <View style={[styles.historyRow, { backgroundColor: tokens.surface.card }]}>
      <View style={[styles.iconCircle, { backgroundColor: tokens.surface.sunken }]}>
        <Icon source="scale-bathroom" size={20} color={tokens.accent.base} />
      </View>
      <View style={styles.historyInfo}>
        <Text style={[styles.historyDate, { color: tokens.text.primary }]}>
          {shortDate(row.recorded_on)}
        </Text>
        {row.notes && (
          <Text style={[styles.historyNotes, { color: tokens.text.secondary }]} numberOfLines={1}>
            {row.notes}
          </Text>
        )}
      </View>
      <View style={styles.historyMeta}>
        <Text style={[styles.historyWeight, { color: tokens.text.primary }]}>{row.weight} kg</Text>
        <Text style={[styles.historyBmi, { color: tokens.text.secondary }]}>
          {row.bmi != null ? `IMC ${Number(row.bmi).toFixed(1)}` : 'IMC —'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', gap: 2 },
  statValue: { fontSize: fontSize.lg, fontWeight: '700' },
  statLabel: { fontSize: fontSize.xs },

  bandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bandHint: { fontSize: fontSize.xs },

  chartCard: { gap: spacing.md },
  chartTitle: { fontSize: fontSize.md, fontWeight: '600' },

  formCard: { gap: spacing.sm },
  formHint: { fontSize: fontSize.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  rowItem: { flex: 1 },
  input: { marginBottom: spacing.xs },
  submit: {
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    minHeight: touch.min,
    alignItems: 'center',
  },
  submitText: { fontSize: fontSize.md, fontWeight: '700' },

  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', marginTop: spacing.sm },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: touch.min,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: { flex: 1, gap: 2 },
  historyDate: { fontSize: fontSize.md, fontWeight: '600' },
  historyNotes: { fontSize: fontSize.sm },
  historyMeta: { alignItems: 'flex-end', gap: 2 },
  historyWeight: { fontSize: fontSize.md, fontWeight: '700' },
  historyBmi: { fontSize: fontSize.xs },
});
