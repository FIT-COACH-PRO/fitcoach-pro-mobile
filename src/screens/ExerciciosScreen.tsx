import { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Text, Icon, TouchableRipple, TextInput, ActivityIndicator } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader, EmptyState, ErrorState } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize, touch } from '../theme';
import { listExercises, createExercise } from '../api/endpoints';
import type { ExerciseLibrary } from '../types/database';
import type { TreinosStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<TreinosStackParamList, 'Exercicios'>;

/**
 * Catálogo de exercícios (exercise_library). É a porta de entrada dos
 * substitutos: tocar num exercício abre a tela onde se cadastra "se a máquina X
 * estiver ocupada, use Y".
 */
export function ExerciciosScreen({ navigation }: Props) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<ExerciseLibrary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    try {
      setItems(await listExercises());
      setError(null);
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : 'Não foi possível carregar o catálogo.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createExercise({ name });
      setNewName('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível cadastrar o exercício.');
    } finally {
      setCreating(false);
    }
  };

  const filtered = (items ?? []).filter((e) =>
    e.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
      <ScreenHeader
        title="Exercícios"
        subtitle="Catálogo e substitutos"
        onBack={navigation.goBack}
      />

      {items === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={tokens.accent.base} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {error && <ErrorState message={error} onRetry={load} />}

          <TextInput
            label="Buscar exercício"
            value={query}
            onChangeText={setQuery}
            mode="outlined"
            left={<TextInput.Icon icon="magnify" />}
            style={styles.input}
          />

          <View style={styles.addRow}>
            <TextInput
              label="Novo exercício"
              value={newName}
              onChangeText={setNewName}
              mode="outlined"
              style={[styles.input, styles.addInput]}
            />
            <TouchableRipple
              onPress={add}
              disabled={creating || !newName.trim()}
              style={[
                styles.addBtn,
                { backgroundColor: tokens.accent.base, opacity: creating || !newName.trim() ? 0.5 : 1 },
              ]}
              borderless
            >
              <Icon source="plus" size={touch.glyph} color={tokens.text.onAccent} />
            </TouchableRipple>
          </View>

          {filtered.length === 0 ? (
            <EmptyState
              icon="dumbbell"
              title="Nenhum exercício"
              subtitle="Cadastre um exercício para começar a montar a lista de substitutos."
            />
          ) : (
            filtered.map((ex) => (
              <TouchableRipple
                key={ex.id}
                onPress={() =>
                  navigation.navigate('ExercicioSubstitutos', {
                    exerciseId: ex.id,
                    exerciseName: ex.name,
                  })
                }
                style={[styles.row, { backgroundColor: tokens.surface.card }]}
              >
                <View style={styles.rowInner}>
                  <View style={[styles.rowIcon, { backgroundColor: tokens.surface.sunken }]}>
                    <Icon source="dumbbell" size={touch.glyph} color={tokens.accent.base} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={[styles.rowTitle, { color: tokens.text.primary }]}>{ex.name}</Text>
                    <Text style={[styles.rowSubtitle, { color: tokens.text.secondary }]}>
                      {[ex.muscle_group, ex.equipment].filter(Boolean).join(' • ') ||
                        (ex.is_global ? 'Exercício global' : 'Sem grupo definido')}
                    </Text>
                  </View>
                  <Icon source="chevron-right" size={touch.chevron} color={tokens.text.muted} />
                </View>
              </TouchableRipple>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  input: { marginBottom: spacing.xs },

  addRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  addInput: { flex: 1 },
  addBtn: {
    width: touch.min,
    height: touch.min,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },

  row: { borderRadius: radius.md },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    minHeight: touch.min,
  },
  rowIcon: {
    width: touch.circle,
    height: touch.circle,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: fontSize.md, fontWeight: '600' },
  rowSubtitle: { fontSize: fontSize.sm },
});
