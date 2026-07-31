import { useCallback, useMemo, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Searchbar, TouchableRipple, Text, Icon, FAB, ActivityIndicator } from 'react-native-paper';
import { ScreenHeader, EmptyState, StatusBadge } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize } from '../theme';
import { listWorkouts } from '../api/endpoints';
import { useAuth } from '../hooks/useAuth';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { trainerDisplayName } from '../lib/format';
import { sampleWorkouts } from '../data/sample';
import type { Workout } from '../types/database';
import type { TreinosListNavigationProp } from '../navigation/types';

const DIFF_LABEL: Record<NonNullable<Workout['difficulty']>, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

/** "Todos" sempre disponível; demais chips vêm só de template_category realmente cadastrado. */
const ALL_CATEGORY = 'Todos';

type Row = {
  id: string;
  name: string;
  level: string;
  icon: string;
  description?: string;
  category?: string | null;
  durationLabel?: string | null;
  isActive: boolean;
};

const fromWorkout = (w: Workout): Row => ({
  id: w.id,
  name: w.name,
  level: w.difficulty ? DIFF_LABEL[w.difficulty] : 'Personalizado',
  icon: 'dumbbell',
  description: w.description ?? undefined,
  category: w.template_category,
  durationLabel: w.duration_weeks ? `${w.duration_weeks} sem` : null,
  isActive: w.student_id != null,
});

export function WorkoutsScreen() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<TreinosListNavigationProp>();
  const { user } = useAuth();
  const trainerName = trainerDisplayName(user);
  const hasUnread = useUnreadNotifications();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORY);
  const [rows, setRows] = useState<Row[] | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await listWorkouts();
      setRows(list.map(fromWorkout));
    } catch {
      setRows(
        sampleWorkouts.map((w) => ({
          id: w.id,
          name: w.name,
          level: w.level,
          icon: w.icon,
          description: w.description,
          category: null,
          durationLabel: null,
          isActive: false,
        }))
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Chips derivados só de template_category realmente presente nos treinos — sem inventar categoria.
  const categories = useMemo(() => {
    if (!rows) return [];
    const set = new Set(rows.map((r) => r.category).filter((c): c is string => !!c));
    return [ALL_CATEGORY, ...set];
  }, [rows]);

  const workouts = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    return rows.filter((w) => {
      if (category !== ALL_CATEGORY && w.category !== category) return false;
      if (q && !w.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, query, category]);

  return (
    <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
      <ScreenHeader
        title="Treinos"
        subtitle="Modelos e prescrições"
        trainerName={trainerName || '?'}
        onNotificationsPress={() => navigation.navigate('Notificacoes')}
        onProfilePress={() => navigation.navigate('Perfil', { screen: 'PerfilHub' })}
        hasUnread={hasUnread}
      />

      <View style={styles.controls}>
        <Searchbar
          placeholder="Buscar treino"
          value={query}
          onChangeText={setQuery}
          style={[styles.search, { backgroundColor: tokens.surface.card }]}
          inputStyle={{ color: tokens.text.primary, minHeight: 0 }}
          iconColor={tokens.text.secondary}
          placeholderTextColor={tokens.text.muted}
          elevation={0}
        />

        {rows !== null && (
          <View style={styles.chips}>
            {categories.map((c) => {
              const selected = category === c;
              return (
                <TouchableRipple
                  key={c}
                  onPress={() => setCategory(c)}
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
                    style={[
                      styles.chipText,
                      { color: selected ? tokens.text.onAccent : tokens.text.secondary },
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableRipple>
              );
            })}
          </View>
        )}
      </View>

      {rows === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={tokens.accent.base} />
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(w) => w.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState icon="dumbbell" title="Sem treinos" subtitle="Crie um treino no botão +." />
          }
          renderItem={({ item }) => (
            <WorkoutRow
              workout={item}
              onPress={() => navigation.navigate('TreinoDetalhe', { workoutId: item.id })}
            />
          )}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: tokens.accent.base }]}
        color={tokens.text.onAccent}
        onPress={() => navigation.navigate('TreinoForm')}
      />
    </View>
  );
}

function WorkoutRow({ workout, onPress }: { workout: Row; onPress: () => void }) {
  const { tokens } = useAppTheme();
  return (
    <TouchableRipple onPress={onPress} style={[styles.row, { backgroundColor: tokens.surface.card }]}>
      <View style={styles.rowInner}>
        <View style={styles.rowTop}>
          <View style={[styles.rowIcon, { backgroundColor: tokens.surface.sunken }]}>
            <Icon source={workout.icon} size={20} color={tokens.accent.base} />
          </View>
          <View style={styles.rowInfo}>
            <Text style={[styles.rowName, { color: tokens.text.primary }]} numberOfLines={1}>
              {workout.name}
            </Text>
            <Text style={[styles.rowLevel, { color: tokens.text.secondary }]} numberOfLines={1}>
              {workout.level}
            </Text>
          </View>
          <Icon source="chevron-right" size={20} color={tokens.text.muted} />
        </View>

        {workout.description && (
          <Text style={[styles.rowDescription, { color: tokens.text.secondary }]} numberOfLines={2}>
            {workout.description}
          </Text>
        )}

        {(workout.isActive || workout.durationLabel) && (
          <View style={styles.rowFooter}>
            {workout.isActive && <StatusBadge label="Ativo" tone="success" />}
            {workout.durationLabel && (
              <Text style={[styles.rowDuration, { color: tokens.text.muted }]}>
                {workout.durationLabel}
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  controls: { paddingHorizontal: spacing.lg, gap: spacing.md, marginBottom: spacing.sm },
  search: { borderRadius: radius.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: fontSize.sm, fontWeight: '600' },

  list: { paddingHorizontal: spacing.lg, paddingBottom: 96, gap: spacing.sm },
  row: { borderRadius: radius.lg },
  rowInner: { padding: spacing.md, gap: spacing.sm },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { fontSize: fontSize.md, fontWeight: '600' },
  rowLevel: { fontSize: fontSize.sm },
  rowDescription: { fontSize: fontSize.sm, lineHeight: 18 },
  rowFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowDuration: { fontSize: fontSize.xs, fontWeight: '600' },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, borderRadius: radius.pill },
});
