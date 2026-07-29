import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput, Text, TouchableRipple, Icon } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader, ErrorState } from '../components/ui';
import { createWorkout, listStudents, type WorkoutDayInput } from '../api/endpoints';
import { useAppTheme, spacing, radius, fontSize } from '../theme';
import type { TreinosStackParamList } from '../navigation/types';
import type { Student, Workout } from '../types/database';

type Props = NativeStackScreenProps<TreinosStackParamList, 'TreinoForm'>;

type ExerciseDraft = { exercise_name: string; sets: string; reps: string; weight: string };
type DayDraft = { name: string; exercises: ExerciseDraft[] };

const DIFFS: { value: NonNullable<Workout['difficulty']>; label: string }[] = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
];

const emptyExercise = (): ExerciseDraft => ({ exercise_name: '', sets: '', reps: '', weight: '' });
const dayLetter = (i: number) => String.fromCharCode(65 + i); // A, B, C…
const newDay = (i: number): DayDraft => ({ name: `Treino ${dayLetter(i)}`, exercises: [emptyExercise()] });

export function WorkoutFormScreen({ navigation }: Props) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null); // null = modelo
  const [difficulty, setDifficulty] = useState<Workout['difficulty']>(null);
  const [days, setDays] = useState<DayDraft[]>([newDay(0)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listStudents()
      .then((list) => alive && setStudents(list))
      .catch(() => alive && setStudents([]));
    return () => {
      alive = false;
    };
  }, []);

  // ---- mutações imutáveis do rascunho ----
  const addDay = () => setDays((ds) => [...ds, newDay(ds.length)]);
  const removeDay = (di: number) => setDays((ds) => ds.filter((_, i) => i !== di));
  const setDayName = (di: number, value: string) =>
    setDays((ds) => ds.map((d, i) => (i === di ? { ...d, name: value } : d)));
  const addExercise = (di: number) =>
    setDays((ds) => ds.map((d, i) => (i === di ? { ...d, exercises: [...d.exercises, emptyExercise()] } : d)));
  const removeExercise = (di: number, ei: number) =>
    setDays((ds) =>
      ds.map((d, i) => (i === di ? { ...d, exercises: d.exercises.filter((_, j) => j !== ei) } : d))
    );
  const setExercise = (di: number, ei: number, field: keyof ExerciseDraft, value: string) =>
    setDays((ds) =>
      ds.map((d, i) =>
        i === di
          ? { ...d, exercises: d.exercises.map((e, j) => (j === ei ? { ...e, [field]: value } : e)) }
          : d
      )
    );

  const onSubmit = async () => {
    const workoutName = name.trim();
    if (!workoutName) return setError('Informe o nome do treino.');

    const daysPayload: WorkoutDayInput[] = [];
    days.forEach((d, i) => {
      const exercises = d.exercises
        .filter((e) => e.exercise_name.trim())
        .map((e) => ({
          exercise_name: e.exercise_name.trim(),
          sets: e.sets.trim() ? Number(e.sets.replace(/[^0-9]/g, '')) || null : null,
          reps: e.reps.trim() || null,
          weight: e.weight.trim() || null,
        }));
      if (exercises.length > 0) {
        daysPayload.push({ name: d.name.trim() || `Treino ${dayLetter(i)}`, exercises });
      }
    });

    if (daysPayload.length === 0) return setError('Adicione ao menos um exercício.');

    setSaving(true);
    setError(null);
    try {
      await createWorkout({
        name: workoutName,
        student_id: studentId,
        difficulty,
        days: daysPayload,
      });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar o treino.');
      setSaving(false);
    }
  };

  const chipStyle = (selected: boolean) => [
    styles.chip,
    {
      backgroundColor: selected ? tokens.accent.base : tokens.surface.card,
      borderColor: selected ? tokens.accent.base : tokens.surface.divider,
    },
  ];
  const chipTextStyle = (selected: boolean) => [
    styles.chipText,
    { color: selected ? tokens.text.onAccent : tokens.text.secondary },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: tokens.surface.page }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top + spacing.lg }}>
        <ScreenHeader title="Novo treino" subtitle="Monte dias e exercícios" onBack={navigation.goBack} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          label="Nome do treino *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
        />

        <Text style={[styles.fieldLabel, { color: tokens.text.secondary }]}>Aluno</Text>
        <View style={styles.chips}>
          <TouchableRipple onPress={() => setStudentId(null)} style={chipStyle(studentId === null)} borderless>
            <Text style={chipTextStyle(studentId === null)}>Modelo</Text>
          </TouchableRipple>
          {students.map((s) => (
            <TouchableRipple
              key={s.id}
              onPress={() => setStudentId(s.id)}
              style={chipStyle(studentId === s.id)}
              borderless
            >
              <Text style={chipTextStyle(studentId === s.id)}>{s.full_name}</Text>
            </TouchableRipple>
          ))}
        </View>

        <Text style={[styles.fieldLabel, { color: tokens.text.secondary }]}>Dificuldade</Text>
        <View style={styles.chips}>
          {DIFFS.map((d) => {
            const selected = difficulty === d.value;
            return (
              <TouchableRipple
                key={d.value}
                onPress={() => setDifficulty(selected ? null : d.value)}
                style={chipStyle(selected)}
                borderless
              >
                <Text style={chipTextStyle(selected)}>{d.label}</Text>
              </TouchableRipple>
            );
          })}
        </View>

        {days.map((day, di) => (
          <View key={di} style={[styles.dayCard, { backgroundColor: tokens.surface.card }]}>
            <View style={styles.dayHeader}>
              <TextInput
                label="Dia"
                value={day.name}
                onChangeText={(t) => setDayName(di, t)}
                mode="outlined"
                dense
                style={styles.dayName}
              />
              {days.length > 1 && (
                <TouchableRipple onPress={() => removeDay(di)} style={styles.iconBtn} borderless>
                  <Icon source="trash-can-outline" size={22} color={tokens.danger.base} />
                </TouchableRipple>
              )}
            </View>

            {day.exercises.map((ex, ei) => (
              <View key={ei} style={styles.exercise}>
                <View style={styles.exTop}>
                  <TextInput
                    label={`Exercício ${ei + 1}`}
                    value={ex.exercise_name}
                    onChangeText={(t) => setExercise(di, ei, 'exercise_name', t)}
                    mode="outlined"
                    dense
                    style={styles.exName}
                  />
                  {day.exercises.length > 1 && (
                    <TouchableRipple onPress={() => removeExercise(di, ei)} style={styles.iconBtn} borderless>
                      <Icon source="close" size={20} color={tokens.text.muted} />
                    </TouchableRipple>
                  )}
                </View>
                <View style={styles.exMetrics}>
                  <TextInput
                    label="Séries"
                    value={ex.sets}
                    onChangeText={(t) => setExercise(di, ei, 'sets', t)}
                    keyboardType="numeric"
                    mode="outlined"
                    dense
                    style={styles.metric}
                  />
                  <TextInput
                    label="Reps"
                    value={ex.reps}
                    onChangeText={(t) => setExercise(di, ei, 'reps', t)}
                    mode="outlined"
                    dense
                    style={styles.metric}
                  />
                  <TextInput
                    label="Carga"
                    value={ex.weight}
                    onChangeText={(t) => setExercise(di, ei, 'weight', t)}
                    mode="outlined"
                    dense
                    style={styles.metric}
                  />
                </View>
              </View>
            ))}

            <TouchableRipple onPress={() => addExercise(di)} style={styles.addRow} borderless>
              <View style={styles.addInner}>
                <Icon source="plus" size={18} color={tokens.accent.base} />
                <Text style={[styles.addText, { color: tokens.accent.base }]}>Exercício</Text>
              </View>
            </TouchableRipple>
          </View>
        ))}

        <TouchableRipple
          onPress={addDay}
          style={[styles.addDay, { borderColor: tokens.surface.divider }]}
          borderless
        >
          <View style={styles.addInner}>
            <Icon source="plus" size={18} color={tokens.text.primary} />
            <Text style={[styles.addText, { color: tokens.text.primary }]}>Adicionar dia</Text>
          </View>
        </TouchableRipple>

        {error && <ErrorState message={error} />}

        <TouchableRipple
          onPress={onSubmit}
          disabled={saving}
          style={[styles.submit, { backgroundColor: tokens.accent.base, opacity: saving ? 0.7 : 1 }]}
          borderless
        >
          <Text style={[styles.submitText, { color: tokens.text.onAccent }]}>
            {saving ? 'Salvando…' : 'Salvar treino'}
          </Text>
        </TouchableRipple>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xs },
  input: { marginBottom: spacing.xs },

  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', marginTop: spacing.sm, marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: fontSize.sm, fontWeight: '600' },

  dayCard: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, marginTop: spacing.sm },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dayName: { flex: 1 },
  iconBtn: { borderRadius: radius.pill, padding: spacing.xs },

  exercise: { gap: spacing.xs },
  exTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  exName: { flex: 1 },
  exMetrics: { flexDirection: 'row', gap: spacing.sm },
  metric: { flex: 1 },

  addRow: { alignSelf: 'flex-start', borderRadius: radius.md, paddingVertical: spacing.xs },
  addInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xs },
  addText: { fontSize: fontSize.sm, fontWeight: '600' },
  addDay: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },

  submit: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitText: { fontSize: fontSize.md, fontWeight: '700' },
});
