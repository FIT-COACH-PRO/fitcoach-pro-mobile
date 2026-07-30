import { useCallback, useMemo, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Searchbar, TouchableRipple, Text, Icon, FAB, ActivityIndicator } from 'react-native-paper';
import { ScreenHeader, Avatar, StatusBadge, EmptyState, type Tone } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize } from '../theme';
import { listStudents } from '../api/endpoints';
import { sampleStudents, type StudentStatus } from '../data/sample';
import type { Student } from '../types/database';
import type { AlunosStackParamList } from '../navigation/types';

const STATUS_META: Record<StudentStatus, { label: string; tone: Tone }> = {
  active: { label: 'Ativo', tone: 'success' },
  paused: { label: 'Pausado', tone: 'warning' },
  inactive: { label: 'Inativo', tone: 'neutral' },
};

const FILTERS: StudentStatus[] = ['active', 'inactive', 'paused'];

/** Forma mínima que a linha da lista consome (real ou exemplo). */
type Row = { id: string; name: string; focus: string; status: StudentStatus };

const fromStudent = (s: Student): Row => ({
  id: s.id,
  name: s.full_name,
  focus: s.objective?.trim() || 'Objetivo não definido',
  status: s.status,
});

export function AlunosListScreen() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AlunosStackParamList>>();

  const [rows, setRows] = useState<Row[] | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StudentStatus | null>(null);

  const load = useCallback(async () => {
    try {
      const students = await listStudents();
      setRows(students.map(fromStudent));
    } catch {
      // Sem sessão/backend: cai nos dados de exemplo para a tela não quebrar.
      setRows(sampleStudents.map((s) => ({ id: s.id, name: s.name, focus: s.focus, status: s.status })));
    }
  }, []);

  // Recarrega ao focar (inclui voltar da tela de cadastro).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const students = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    return rows.filter((s) => {
      if (filter && s.status !== filter) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, query, filter]);

  const avatarColor = (i: number) =>
    [tokens.accent.base, tokens.success.base, tokens.warning.base, tokens.danger.base][i % 4];

  return (
    <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
      <ScreenHeader title="Alunos" subtitle="Gerencie seus alunos" />

      <View style={styles.controls}>
        <Searchbar
          placeholder="Buscar aluno"
          value={query}
          onChangeText={setQuery}
          style={[styles.search, { backgroundColor: tokens.surface.card }]}
          inputStyle={{ color: tokens.text.primary, minHeight: 0 }}
          iconColor={tokens.text.secondary}
          placeholderTextColor={tokens.text.muted}
          elevation={0}
        />

        <View style={styles.chips}>
          {FILTERS.map((f) => {
            const selected = filter === f;
            const meta = STATUS_META[f];
            return (
              <TouchableRipple
                key={f}
                onPress={() => setFilter(selected ? null : f)}
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
                  {meta.label}
                </Text>
              </TouchableRipple>
            );
          })}
        </View>
      </View>

      {rows === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={tokens.accent.base} />
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              icon="account-plus-outline"
              title="Lista vazia"
              subtitle="Adicione seu 1º aluno no botão +."
            />
          }
          renderItem={({ item, index }) => (
            <StudentRow
              student={item}
              color={avatarColor(index)}
              onPress={() => navigation.navigate('AlunoDetalhe', { studentId: item.id })}
            />
          )}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: tokens.accent.base }]}
        color={tokens.text.onAccent}
        onPress={() => navigation.navigate('AlunoForm')}
      />
    </View>
  );
}

function StudentRow({
  student,
  color,
  onPress,
}: {
  student: Row;
  color: string;
  onPress: () => void;
}) {
  const { tokens } = useAppTheme();
  const meta = STATUS_META[student.status];
  return (
    <TouchableRipple onPress={onPress} style={[styles.row, { backgroundColor: tokens.surface.card }]}>
      <View style={styles.rowInner}>
        <Avatar name={student.name} color={color} />
        <View style={styles.rowInfo}>
          <Text style={[styles.rowName, { color: tokens.text.primary }]} numberOfLines={1}>
            {student.name}
          </Text>
          <Text style={[styles.rowFocus, { color: tokens.text.secondary }]} numberOfLines={1}>
            {student.focus}
          </Text>
        </View>
        <StatusBadge label={meta.label} tone={meta.tone} />
        <Icon source="chevron-right" size={20} color={tokens.text.muted} />
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  controls: { paddingHorizontal: spacing.lg, gap: spacing.md, marginBottom: spacing.sm },
  search: { borderRadius: radius.md },
  chips: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: fontSize.sm, fontWeight: '600' },

  list: { paddingHorizontal: spacing.lg, paddingBottom: 96, gap: spacing.sm },
  row: { borderRadius: radius.lg },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { fontSize: fontSize.md, fontWeight: '600' },
  rowFocus: { fontSize: fontSize.sm },

  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    borderRadius: radius.pill,
  },
});
