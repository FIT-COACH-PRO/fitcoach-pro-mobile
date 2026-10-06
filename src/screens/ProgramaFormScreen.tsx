import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput, Text, Icon, TouchableRipple, ActivityIndicator } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader, ErrorState, EmptyState } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize, touch } from '../theme';
import { listWorkouts, createProgram, type ProgramWorkoutInput } from '../api/endpoints';
import type { Workout } from '../types/database';
import type { TreinosStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<TreinosStackParamList, 'ProgramaForm'>;

// 0 = domingo … 6 = sábado, mesma convenção de student_workout_schedules.
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

type Picked = { workout_id: string; name: string; weekday: number };

/**
 * Monta um programa: escolhe treinos já existentes, define em que dia da semana
 * cada um cai e em quantas semanas o ciclo roda. Os treinos não são duplicados —
 * o programa só referencia workouts.
 */
export function ProgramaFormScreen({ navigation }: Props) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [workouts, setWorkouts] = useState<Workout[] | null>(null);
  const [name, setName] = useState('');
  const [weeks, setWeeks] = useState('8');
  const [description, setDescription] = useState('');
  const [picked, setPicked] = useState<Picked[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await listWorkouts();
        if (alive) setWorkouts(list);
      } catch {
        if (alive) setWorkouts([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const toggle = (w: Workout) => {
    setPicked((current) => {
      const exists = current.find((p) => p.workout_id === w.id);
      if (exists) return current.filter((p) => p.workout_id !== w.id);
      // Distribui pelos dias úteis conforme vai adicionando (seg, qua, sex…).
      const suggested = [1, 3, 5, 2, 4, 6, 0][current.length % 7];
      return [...current, { workout_id: w.id, name: w.name, weekday: suggested }];
    });
  };

  const setWeekday = (workoutId: string, weekday: number) => {
    setPicked((current) =>
      current.map((p) => (p.workout_id === workoutId ? { ...p, weekday } : p))
    );
  };

  const submit = async () => {
    if (!name.trim()) return setError('Dê um nome ao programa.');
    if (picked.length === 0) return setError('Escolha pelo menos um treino.');

    const durationWeeks = weeks.trim() ? Number(weeks.replace(/[^0-9]/g, '')) : null;

    setSaving(true);
    setError(null);
    try {
      const payload: ProgramWorkoutInput[] = picked.map((p) => ({
        workout_id: p.workout_id,
        weekday: p.weekday,
        workout_label: p.name,
      }));
      await createProgram({
        name: name.trim(),
        description: description.trim() || null,
        duration_weeks: durationWeeks && durationWeeks > 0 ? durationWeeks : null,
        workouts: payload,
      });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível criar o programa.');
      setSaving(false);
    }
  };

  const header = (
    <View style={{ paddingTop: insets.top + spacing.lg }}>
      <ScreenHeader
        title="Novo programa"
        subtitle="Agrupe treinos numa sequência"
        onBack={navigation.goBack}
      />
    </View>
  );

  if (workouts === null) {
    return (
      <View style={[styles.screen, { backgroundColor: tokens.surface.page }]}>
        {header}
        <View style={styles.center}>
          <ActivityIndicator color={tokens.accent.base} />
        </View>
      </View>
    );
  }

  if (workouts.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: tokens.surface.page }]}>
        {header}
        <EmptyState
          icon="dumbbell"
          title="Nenhum treino"
          subtitle="Monte pelo menos um treino antes de criar um programa."
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: tokens.surface.page }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {header}

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          label="Nome do programa *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Duração (semanas)"
          value={weeks}
          onChangeText={setWeeks}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Descrição"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        <Text style={[styles.fieldLabel, { color: tokens.text.secondary }]}>Treinos do programa *</Text>
        <View style={styles.chips}>
          {workouts.map((w) => {
            const selected = picked.some((p) => p.workout_id === w.id);
            return (
              <TouchableRipple
                key={w.id}
                onPress={() => toggle(w)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? tokens.accent.base : tokens.surface.card,
                    borderColor: selected ? tokens.accent.base : tokens.surface.divider,
                  },
                ]}
                borderless
              >
                <Text
                  style={[styles.chipText, { color: selected ? tokens.text.onAccent : tokens.text.secondary }]}
                >
                  {w.name}
                </Text>
              </TouchableRipple>
            );
          })}
        </View>

        {picked.length > 0 && (
          <>
            <Text style={[styles.fieldLabel, { color: tokens.text.secondary }]}>
              Dia da semana de cada treino
            </Text>
            {picked.map((p, i) => (
              <View key={p.workout_id} style={[styles.dayCard, { backgroundColor: tokens.surface.card }]}>
                <View style={styles.dayHeader}>
                  <Text style={[styles.dayOrder, { color: tokens.text.muted }]}>{i + 1}</Text>
                  <Text style={[styles.dayName, { color: tokens.text.primary }]} numberOfLines={1}>
                    {p.name}
                  </Text>
                </View>
                <View style={styles.weekRow}>
                  {WEEKDAYS.map((label, index) => {
                    const selected = p.weekday === index;
                    return (
                      <TouchableRipple
                        key={label}
                        onPress={() => setWeekday(p.workout_id, index)}
                        style={[
                          styles.dayPill,
                          {
                            backgroundColor: selected ? tokens.accent.base : tokens.surface.sunken,
                          },
                        ]}
                        borderless
                      >
                        <Text
                          style={[
                            styles.dayPillText,
                            { color: selected ? tokens.text.onAccent : tokens.text.secondary },
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableRipple>
                    );
                  })}
                </View>
              </View>
            ))}
          </>
        )}

        {error && <ErrorState message={error} />}

        <TouchableRipple
          onPress={submit}
          disabled={saving}
          style={[styles.submit, { backgroundColor: tokens.accent.base, opacity: saving ? 0.7 : 1 }]}
          borderless
        >
          <View style={styles.submitInner}>
            <Icon source="content-save-outline" size={18} color={tokens.text.onAccent} />
            <Text style={[styles.submitText, { color: tokens.text.onAccent }]}>
              {saving ? 'Salvando…' : 'Criar programa'}
            </Text>
          </View>
        </TouchableRipple>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xs },
  input: { marginBottom: spacing.xs },

  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', marginTop: spacing.sm, marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: touch.min,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: fontSize.sm, fontWeight: '600' },

  dayCard: { borderRadius: radius.md, padding: spacing.md, gap: spacing.sm, marginBottom: spacing.sm },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dayOrder: { fontSize: fontSize.sm, fontWeight: '700', width: 18 },
  dayName: { flex: 1, fontSize: fontSize.md, fontWeight: '600' },
  weekRow: { flexDirection: 'row', gap: spacing.xs },
  dayPill: { flex: 1, borderRadius: radius.sm, paddingVertical: spacing.sm, alignItems: 'center' },
  dayPillText: { fontSize: fontSize.xs, fontWeight: '600' },

  submit: {
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    minHeight: touch.min,
    marginTop: spacing.md,
  },
  submitInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  submitText: { fontSize: fontSize.md, fontWeight: '700' },
});
