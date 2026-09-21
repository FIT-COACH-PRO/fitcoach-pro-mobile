import { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Text, Icon, TouchableRipple, TextInput, ActivityIndicator } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader, Card, EmptyState, ErrorState } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize, touch } from '../theme';
import { listExercises, listSubstitutes, addSubstitute, removeSubstitute } from '../api/endpoints';
import type { ExerciseLibrary } from '../types/database';
import type { ExerciseSubstitute } from '../types/extras';
import type { TreinosStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<TreinosStackParamList, 'ExercicioSubstitutos'>;

/**
 * Substitutos de um exercício: relação estática (sem IA), do tipo "se a máquina
 * X estiver ocupada, use Y". A relação é many-to-many em exercise_substitutes.
 */
export function ExercicioSubstitutosScreen({ route, navigation }: Props) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { exerciseId, exerciseName } = route.params;

  const [subs, setSubs] = useState<ExerciseSubstitute[] | null>(null);
  const [catalog, setCatalog] = useState<ExerciseLibrary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [list, all] = await Promise.all([listSubstitutes(exerciseId), listExercises()]);
      setSubs(list);
      setCatalog(all);
      setError(null);
    } catch (e) {
      setSubs([]);
      setError(e instanceof Error ? e.message : 'Não foi possível carregar os substitutos.');
    }
  }, [exerciseId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Candidatos: tudo do catálogo menos o próprio exercício e os já cadastrados.
  const candidates = useMemo(() => {
    const already = new Set((subs ?? []).map((s) => s.substitute_id));
    const term = query.trim().toLowerCase();
    return catalog
      .filter((e) => e.id !== exerciseId && !already.has(e.id))
      .filter((e) => (term ? e.name.toLowerCase().includes(term) : true))
      .slice(0, 12);
  }, [catalog, subs, exerciseId, query]);

  const add = async (substituteId: string) => {
    setBusy(true);
    setError(null);
    try {
      await addSubstitute(exerciseId, substituteId);
      setQuery('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível adicionar o substituto.');
    } finally {
      setBusy(false);
    }
  };

  const remove = (substituteId: string, name: string) => {
    Alert.alert('Remover substituto', `Remover "${name}" da lista de alternativas?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await removeSubstitute(exerciseId, substituteId);
            await load();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Não foi possível remover.');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  if (subs === null) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: tokens.surface.page }]}>
        <ActivityIndicator color={tokens.accent.base} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
      <ScreenHeader title={exerciseName} subtitle="Alternativas" onBack={navigation.goBack} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error && <ErrorState message={error} onRetry={load} />}

        <Card style={styles.hintCard}>
          <Icon source="swap-horizontal" size={touch.glyph} color={tokens.accent.base} />
          <Text style={[styles.hint, { color: tokens.text.secondary }]}>
            Se o equipamento estiver ocupado, estes são os exercícios que substituem
            {` ${exerciseName}`}.
          </Text>
        </Card>

        <Text style={[styles.sectionTitle, { color: tokens.text.primary }]}>Substitutos</Text>
        {subs.length === 0 ? (
          <EmptyState
            icon="swap-horizontal"
            title="Nenhum substituto"
            subtitle="Escolha abaixo um exercício do catálogo como alternativa."
          />
        ) : (
          subs.map((s) => (
            <View key={s.substitute_id} style={[styles.row, { backgroundColor: tokens.surface.card }]}>
              <View style={[styles.rowIcon, { backgroundColor: tokens.surface.sunken }]}>
                <Icon source="arrow-right-bold-outline" size={20} color={tokens.success.base} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: tokens.text.primary }]}>
                  {s.substitute?.name ?? 'Exercício'}
                </Text>
                <Text style={[styles.rowSubtitle, { color: tokens.text.secondary }]}>
                  {s.reason ??
                    [s.substitute?.muscle_group, s.substitute?.equipment].filter(Boolean).join(' • ') ??
                    ''}
                </Text>
              </View>
              <TouchableRipple
                onPress={() => remove(s.substitute_id, s.substitute?.name ?? 'este exercício')}
                disabled={busy}
                style={styles.removeBtn}
                borderless
                accessibilityLabel="Remover substituto"
              >
                <Icon source="close" size={touch.glyph} color={tokens.danger.base} />
              </TouchableRipple>
            </View>
          ))
        )}

        <Text style={[styles.sectionTitle, { color: tokens.text.primary }]}>
          Adicionar do catálogo
        </Text>
        <TextInput
          label="Buscar exercício"
          value={query}
          onChangeText={setQuery}
          mode="outlined"
          left={<TextInput.Icon icon="magnify" />}
          style={styles.input}
        />

        {candidates.length === 0 ? (
          <Text style={[styles.rowSubtitle, { color: tokens.text.muted }]}>
            Nenhum exercício disponível para adicionar.
          </Text>
        ) : (
          <View style={styles.chips}>
            {candidates.map((c) => (
              <TouchableRipple
                key={c.id}
                onPress={() => add(c.id)}
                disabled={busy}
                style={[
                  styles.chip,
                  { backgroundColor: tokens.surface.card, borderColor: tokens.surface.divider },
                ]}
                borderless
              >
                <Text style={[styles.chipText, { color: tokens.text.primary }]}>+ {c.name}</Text>
              </TouchableRipple>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },

  hintCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  hint: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },

  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', marginTop: spacing.sm },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: touch.min,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: fontSize.md, fontWeight: '600' },
  rowSubtitle: { fontSize: fontSize.sm },
  removeBtn: {
    width: touch.min,
    height: touch.min,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  input: { marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: touch.min,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: fontSize.sm, fontWeight: '600' },
});
