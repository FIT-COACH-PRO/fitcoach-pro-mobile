import { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Text, TextInput, TouchableRipple, ActivityIndicator } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader, Card, EmptyState, ErrorState } from '../components/ui';
import { BarChart } from '../components/BarChart';
import { useAppTheme, spacing, radius, fontSize, touch } from '../theme';
import { listExerciseLogs, createExerciseLog } from '../api/endpoints';
import { toLoadSeries, exerciseNamesFrom, shortDate } from '../lib/progress';
import { parseMoney } from '../lib/forms';
import type { ExerciseLog } from '../types/extras';
import type { AlunosStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AlunosStackParamList, 'AlunoCargas'>;

/**
 * Histórico de cargas por exercício (exercise_logs). Cada série executada é uma
 * linha com data, carga e repetições — a tela agrega por dia para mostrar a
 * evolução de um exercício específico ao longo do tempo.
 */
export function CargasScreen({ route, navigation }: Props) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { studentId, studentName, exerciseName: initialExercise } = route.params;

  const [logs, setLogs] = useState<ExerciseLog[] | null>(null);
  const [selected, setSelected] = useState<string | null>(initialExercise ?? null);
  const [error, setError] = useState<string | null>(null);

  const [exercise, setExercise] = useState(initialExercise ?? '');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await listExerciseLogs(studentId);
      setLogs(list);
      setError(null);
      setSelected((current) => current ?? exerciseNamesFrom(list)[0] ?? null);
    } catch (e) {
      setLogs([]);
      setError(e instanceof Error ? e.message : 'Não foi possível carregar o histórico.');
    }
  }, [studentId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const names = useMemo(() => exerciseNamesFrom(logs ?? []), [logs]);
  const series = useMemo(
    () => toLoadSeries((logs ?? []).filter((l) => l.exercise_name === selected)),
    [logs, selected]
  );
  const best = series.length > 0 ? Math.max(...series.map((p) => p.topWeight)) : null;
  const latest = series.length > 0 ? series[series.length - 1] : null;

  const save = async () => {
    const name = exercise.trim();
    if (!name) return setError('Informe o nome do exercício.');
    const kg = weight.trim() ? parseMoney(weight) : null;
    const r = reps.trim() ? Number(reps.replace(/[^0-9]/g, '')) : null;

    setSaving(true);
    setError(null);
    try {
      await createExerciseLog({
        student_id: studentId,
        exercise_name: name,
        weight_kg: kg,
        reps: Number.isFinite(r as number) ? r : null,
        // A série do dia é a próxima do mesmo exercício já registrada hoje.
        set_number: nextSetNumber(logs ?? [], name),
      });
      setWeight('');
      setReps('');
      setSelected(name);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível registrar a carga.');
    } finally {
      setSaving(false);
    }
  };

  if (logs === null) {
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
        <ScreenHeader title="Cargas" subtitle={studentName} onBack={navigation.goBack} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error && <ErrorState message={error} />}

        {names.length > 0 && (
          <View style={styles.chips}>
            {names.map((name) => {
              const isSelected = name === selected;
              return (
                <TouchableRipple
                  key={name}
                  onPress={() => setSelected(name)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? tokens.accent.base : tokens.surface.card,
                      borderColor: isSelected ? tokens.accent.base : tokens.surface.divider,
                    },
                  ]}
                  borderless
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isSelected ? tokens.text.onAccent : tokens.text.secondary },
                    ]}
                  >
                    {name}
                  </Text>
                </TouchableRipple>
              );
            })}
          </View>
        )}

        {selected && series.length > 0 ? (
          <>
            <View style={styles.statsRow}>
              <Stat value={latest ? `${latest.topWeight} kg` : '—'} label="Última carga" />
              <Stat value={best != null ? `${best} kg` : '—'} label="Melhor carga" />
              <Stat value={String(series.length)} label="Sessões" />
            </View>

            <Card style={styles.chartCard}>
              <Text style={[styles.chartTitle, { color: tokens.text.primary }]}>
                {selected} — maior carga por dia
              </Text>
              <BarChart
                data={series.slice(-8).map((p) => ({
                  label: shortDate(p.date),
                  value: p.topWeight,
                  display: `${p.topWeight}`,
                }))}
                relative
                color={tokens.accent.base}
              />
            </Card>

            <Card style={styles.chartCard}>
              <Text style={[styles.chartTitle, { color: tokens.text.primary }]}>
                Volume por dia (carga × reps)
              </Text>
              <BarChart
                data={series.slice(-8).map((p) => ({
                  label: shortDate(p.date),
                  value: p.volume,
                }))}
                color={tokens.success.base}
              />
            </Card>
          </>
        ) : (
          <EmptyState
            icon="weight-lifter"
            title="Sem cargas registradas"
            subtitle="Registre a carga de um exercício abaixo para acompanhar a evolução."
          />
        )}

        <Card style={styles.formCard}>
          <Text style={[styles.chartTitle, { color: tokens.text.primary }]}>Registrar série</Text>
          <TextInput
            label="Exercício *"
            value={exercise}
            onChangeText={setExercise}
            mode="outlined"
            style={styles.input}
          />
          <View style={styles.row}>
            <TextInput
              label="Carga (kg)"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              mode="outlined"
              style={[styles.input, styles.rowItem]}
            />
            <TextInput
              label="Repetições"
              value={reps}
              onChangeText={setReps}
              keyboardType="numeric"
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
              {saving ? 'Salvando…' : 'Registrar carga'}
            </Text>
          </TouchableRipple>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Próximo número de série do exercício no dia de hoje (1 se for a primeira). */
function nextSetNumber(logs: ExerciseLog[], exerciseName: string): number {
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;
  const todayLogs = logs.filter(
    (l) => l.exercise_name === exerciseName && l.performed_on === iso
  );
  return todayLogs.length + 1;
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

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: fontSize.sm, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', gap: 2 },
  statValue: { fontSize: fontSize.lg, fontWeight: '700' },
  statLabel: { fontSize: fontSize.xs },

  chartCard: { gap: spacing.md },
  chartTitle: { fontSize: fontSize.md, fontWeight: '600' },

  formCard: { gap: spacing.sm },
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
});
