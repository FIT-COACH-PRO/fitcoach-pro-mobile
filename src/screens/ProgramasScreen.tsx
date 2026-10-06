import { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Text, Icon, TouchableRipple, ActivityIndicator, FAB } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader, EmptyState, ErrorState } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize, touch } from '../theme';
import { listPrograms, listStudents, assignProgramToStudent } from '../api/endpoints';
import type { Program } from '../types/extras';
import type { TreinosStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<TreinosStackParamList, 'Programas'>;

/**
 * Programas (mesociclos): um bundle de treinos numa sequência, atribuível a um
 * aluno de uma vez só. A atribuição reaproveita student_workout_schedules — o
 * vínculo treino↔aluno que já existia.
 */
export function ProgramasScreen({ navigation }: Props) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<Program[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await listPrograms());
      setError(null);
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : 'Não foi possível carregar os programas.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  /** Escolhe o aluno num Alert e atribui o programa inteiro de uma vez. */
  const assign = async (program: Program) => {
    let students: { id: string; full_name: string }[] = [];
    try {
      students = await listStudents();
    } catch {
      return Alert.alert('Atribuir', 'Não foi possível carregar seus alunos.');
    }
    if (students.length === 0) {
      return Alert.alert('Atribuir', 'Cadastre um aluno antes de atribuir um programa.');
    }

    Alert.alert('Atribuir programa', `Para qual aluno enviar "${program.name}"?`, [
      ...students.slice(0, 8).map((s) => ({
        text: s.full_name,
        onPress: async () => {
          setAssigning(true);
          try {
            const count = await assignProgramToStudent(program.id, s.id);
            Alert.alert(
              'Programa atribuído',
              `${count} treino${count === 1 ? '' : 's'} na grade de ${s.full_name}.`
            );
          } catch (e) {
            Alert.alert('Atribuir', e instanceof Error ? e.message : 'Falhou ao atribuir.');
          } finally {
            setAssigning(false);
          }
        },
      })),
      { text: 'Cancelar', style: 'cancel' as const },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
      <ScreenHeader
        title="Programas"
        subtitle="Sequências de treino (mesociclos)"
        onBack={navigation.goBack}
      />

      {items === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={tokens.accent.base} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {error && <ErrorState message={error} onRetry={load} />}

          {items.length === 0 ? (
            <EmptyState
              icon="calendar-multiselect"
              title="Nenhum programa"
              subtitle="Agrupe vários treinos numa sequência (ex.: 8 semanas) e atribua a um aluno de uma vez."
            />
          ) : (
            items.map((p) => {
              const count = p.program_workouts?.length ?? 0;
              return (
                <View key={p.id} style={[styles.card, { backgroundColor: tokens.surface.card }]}>
                  <View style={styles.cardTop}>
                    <View style={[styles.iconCircle, { backgroundColor: tokens.surface.sunken }]}>
                      <Icon source="calendar-multiselect" size={touch.glyph} color={tokens.accent.base} />
                    </View>
                    <View style={styles.cardText}>
                      <Text style={[styles.cardTitle, { color: tokens.text.primary }]}>{p.name}</Text>
                      <Text style={[styles.cardSubtitle, { color: tokens.text.secondary }]}>
                        {count} treino{count === 1 ? '' : 's'}
                        {p.duration_weeks ? ` • ${p.duration_weeks} semanas` : ''}
                      </Text>
                    </View>
                  </View>

                  {p.description && (
                    <Text style={[styles.cardDesc, { color: tokens.text.secondary }]} numberOfLines={2}>
                      {p.description}
                    </Text>
                  )}

                  <TouchableRipple
                    onPress={() => assign(p)}
                    disabled={assigning || count === 0}
                    style={[
                      styles.assignBtn,
                      { backgroundColor: tokens.accent.base, opacity: assigning || count === 0 ? 0.5 : 1 },
                    ]}
                    borderless
                  >
                    <View style={styles.assignInner}>
                      <Icon source="account-arrow-right-outline" size={18} color={tokens.text.onAccent} />
                      <Text style={[styles.assignText, { color: tokens.text.onAccent }]}>
                        Atribuir a um aluno
                      </Text>
                    </View>
                  </TouchableRipple>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: tokens.accent.base }]}
        color={tokens.text.onAccent}
        onPress={() => navigation.navigate('ProgramaForm')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 96, gap: spacing.md },

  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: {
    width: touch.circle,
    height: touch.circle,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: 2 },
  cardTitle: { fontSize: fontSize.md, fontWeight: '700' },
  cardSubtitle: { fontSize: fontSize.sm },
  cardDesc: { fontSize: fontSize.sm, lineHeight: 20 },

  assignBtn: { borderRadius: radius.md, paddingVertical: spacing.md, minHeight: touch.min },
  assignInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  assignText: { fontSize: fontSize.md, fontWeight: '600' },

  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, borderRadius: radius.lg },
});
