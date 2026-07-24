import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Icon, TouchableRipple, ActivityIndicator } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader, EmptyState } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize } from '../theme';
import { getWorkout } from '../api/endpoints';
import { sampleWorkouts, type SampleWorkout } from '../data/sample';
import type { Workout } from '../types/database';
import type { TreinosStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<TreinosStackParamList, 'TreinoDetalhe'>;

type DetailExercise = { name: string; detail: string; sets: string; load: string };
type DetailDay = { label: string; exercises: DetailExercise[] };
type DetailWorkout = { name: string; description?: string; days: DetailDay[] };

function setsLabel(sets: number | null, reps: string | null): string {
  if (sets != null && reps) return `${sets} x ${reps}`;
  if (sets != null) return String(sets);
  if (reps) return reps;
  return '—';
}

function fromWorkout(w: Workout): DetailWorkout {
  const days = [...(w.workout_days ?? [])]
    .sort((a, b) => a.day_order - b.day_order)
    .map((d) => ({
      label: d.day_label || d.name,
      exercises: [...(d.workout_exercises ?? [])]
        .sort((a, b) => a.exercise_order - b.exercise_order)
        .map((ex) => ({
          name: ex.exercise_name,
          detail: ex.notes ?? '',
          sets: setsLabel(ex.sets, ex.reps),
          load: ex.weight ?? '—',
        })),
    }));
  return { name: w.name, description: w.description ?? undefined, days };
}

function fromSample(w: SampleWorkout): DetailWorkout {
  return {
    name: w.name,
    description: w.description,
    days: (w.days ?? []).map((d) => ({
      label: d.label,
      exercises: d.exercises.map((e) => ({ name: e.name, detail: e.detail, sets: e.sets, load: e.load })),
    })),
  };
}

export function TreinoDetalheScreen({ route, navigation }: Props) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { workoutId } = route.params;

  const [workout, setWorkout] = useState<DetailWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [dayIndex, setDayIndex] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const real = await getWorkout(workoutId);
        if (alive) setWorkout(fromWorkout(real));
      } catch {
        const sample = sampleWorkouts.find((w) => w.id === workoutId);
        if (alive) setWorkout(sample ? fromSample(sample) : null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [workoutId]);

  if (loading) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: tokens.surface.page }]}>
        <ActivityIndicator color={tokens.accent.base} />
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
        <ScreenHeader title="Treino" onBack={navigation.goBack} />
        <EmptyState icon="dumbbell" title="Treino não encontrado" />
      </View>
    );
  }

  const days = workout.days;
  const currentDay = days[dayIndex];

  const share = () => {
    const lines = (currentDay?.exercises ?? []).map(
      (e) => `• ${e.name} — ${e.sets}${e.load !== '—' ? ` (${e.load})` : ''}`
    );
    Share.share({
      message: `${workout.name} — ${currentDay?.label ?? ''}\n${lines.join('\n')}`,
    }).catch(() => {});
  };

  return (
    <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
      <ScreenHeader title={workout.name} onBack={navigation.goBack} />

      <ScrollView contentContainerStyle={styles.content}>
        {workout.description && (
          <Text style={[styles.description, { color: tokens.text.secondary }]}>
            {workout.description}
          </Text>
        )}

        {days.length === 0 ? (
          <EmptyState icon="dumbbell" title="Treino sem exercícios" />
        ) : (
          <>
            {days.length > 1 && (
              <View style={styles.tabs}>
                {days.map((d, i) => {
                  const selected = i === dayIndex;
                  return (
                    <TouchableRipple
                      key={`${d.label}-${i}`}
                      onPress={() => setDayIndex(i)}
                      style={[
                        styles.tab,
                        {
                          backgroundColor: selected ? tokens.accent.base : tokens.surface.card,
                          borderColor: selected ? tokens.accent.base : tokens.surface.divider,
                        },
                      ]}
                      borderless
                    >
                      <Text
                        style={[
                          styles.tabText,
                          { color: selected ? tokens.text.onAccent : tokens.text.secondary },
                        ]}
                      >
                        {d.label}
                      </Text>
                    </TouchableRipple>
                  );
                })}
              </View>
            )}

            <View style={styles.exercises}>
              {(currentDay?.exercises ?? []).map((ex, i) => (
                <ExerciseRow key={`${ex.name}-${i}`} exercise={ex} />
              ))}
            </View>

            <TouchableRipple
              onPress={share}
              style={[styles.shareBtn, { backgroundColor: tokens.success.base }]}
              borderless
            >
              <View style={styles.shareInner}>
                <Icon source="share-variant" size={18} color={tokens.text.onDark} />
                <Text style={[styles.shareText, { color: tokens.text.onDark }]}>Compartilhar treino</Text>
              </View>
            </TouchableRipple>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ExerciseRow({ exercise }: { exercise: DetailExercise }) {
  const { tokens } = useAppTheme();
  return (
    <View style={[styles.exRow, { backgroundColor: tokens.surface.card }]}>
      <View style={styles.exInfo}>
        <Text style={[styles.exName, { color: tokens.text.primary }]}>{exercise.name}</Text>
        {!!exercise.detail && (
          <Text style={[styles.exDetail, { color: tokens.text.secondary }]}>{exercise.detail}</Text>
        )}
      </View>
      <View style={styles.exMeta}>
        <Text style={[styles.exSets, { color: tokens.text.primary }]}>{exercise.sets}</Text>
        <Text
          style={[
            styles.exLoad,
            { color: exercise.load === '—' ? tokens.text.muted : tokens.success.base },
          ]}
        >
          {exercise.load}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  description: { fontSize: fontSize.sm, lineHeight: 20 },

  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  tabText: { fontSize: fontSize.sm, fontWeight: '600' },

  exercises: { gap: spacing.sm },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  exInfo: { flex: 1, gap: 2 },
  exName: { fontSize: fontSize.md, fontWeight: '600' },
  exDetail: { fontSize: fontSize.sm },
  exMeta: { alignItems: 'flex-end', gap: 2 },
  exSets: { fontSize: fontSize.md, fontWeight: '600' },
  exLoad: { fontSize: fontSize.sm, fontWeight: '600' },

  shareBtn: { borderRadius: radius.md, paddingVertical: spacing.md, marginTop: spacing.sm },
  shareInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  shareText: { fontSize: fontSize.md, fontWeight: '600' },
});
