import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput, Text, TouchableRipple, ActivityIndicator } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader, ErrorState, EmptyState } from '../components/ui';
import { createSession, listStudents } from '../api/endpoints';
import { useAppTheme, spacing, radius, fontSize } from '../theme';
import type { AgendaStackParamList } from '../navigation/types';
import type { Student } from '../types/database';

type Props = NativeStackScreenProps<AgendaStackParamList, 'AgendaForm'>;

const pad = (n: number) => String(n).padStart(2, '0');

function todayBR(): string {
  const d = new Date();
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "DD/MM/AAAA" + "HH:MM" → Date local; null se inválido. */
function toLocalDate(br: string, time: string): Date | null {
  const dm = br.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const tm = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!dm || !tm) return null;
  const [, dd, mm, yyyy] = dm;
  const [, hh, min] = tm;
  const day = Number(dd);
  const month = Number(mm);
  const hour = Number(hh);
  const minute = Number(min);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  const d = new Date(Number(yyyy), month - 1, day, hour, minute, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function AgendaFormScreen({ navigation }: Props) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [students, setStudents] = useState<Student[] | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [date, setDate] = useState(todayBR());
  const [startTime, setStartTime] = useState('08:00');
  const [duration, setDuration] = useState('60');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await listStudents();
        if (alive) setStudents(list);
      } catch {
        if (alive) setStudents([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const onSubmit = async () => {
    if (!studentId) return setError('Selecione o aluno.');
    const start = toLocalDate(date, startTime);
    if (!start) return setError('Data ou horário inválidos. Use DD/MM/AAAA e HH:MM.');
    const mins = Number(duration.replace(/[^0-9]/g, ''));
    if (!Number.isFinite(mins) || mins <= 0) return setError('Informe uma duração válida (min).');
    const end = new Date(start.getTime() + mins * 60000);

    setSaving(true);
    setError(null);
    try {
      await createSession({
        student_id: studentId,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
      });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível agendar a aula.');
      setSaving(false);
    }
  };

  const header = (
    <View style={{ paddingTop: insets.top + spacing.lg }}>
      <ScreenHeader title="Nova aula" subtitle="Agende um horário" onBack={navigation.goBack} />
    </View>
  );

  if (students === null) {
    return (
      <View style={[styles.screen, { backgroundColor: tokens.surface.page }]}>
        {header}
        <View style={styles.center}>
          <ActivityIndicator color={tokens.accent.base} />
        </View>
      </View>
    );
  }

  if (students.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: tokens.surface.page }]}>
        {header}
        <EmptyState
          icon="account-plus-outline"
          title="Nenhum aluno"
          subtitle="Cadastre um aluno antes de agendar uma aula."
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
        <Text style={[styles.fieldLabel, { color: tokens.text.secondary }]}>Aluno *</Text>
        <View style={styles.chips}>
          {students.map((s) => {
            const selected = studentId === s.id;
            return (
              <TouchableRipple
                key={s.id}
                onPress={() => setStudentId(s.id)}
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
                  {s.full_name}
                </Text>
              </TouchableRipple>
            );
          })}
        </View>

        <TextInput
          label="Data (DD/MM/AAAA) *"
          value={date}
          onChangeText={setDate}
          keyboardType="numbers-and-punctuation"
          mode="outlined"
          style={styles.input}
        />
        <View style={styles.row}>
          <TextInput
            label="Início (HH:MM) *"
            value={startTime}
            onChangeText={setStartTime}
            keyboardType="numbers-and-punctuation"
            mode="outlined"
            style={[styles.input, styles.rowItem]}
          />
          <TextInput
            label="Duração (min) *"
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
            mode="outlined"
            style={[styles.input, styles.rowItem]}
          />
        </View>

        {error && <ErrorState message={error} />}

        <TouchableRipple
          onPress={onSubmit}
          disabled={saving}
          style={[styles.submit, { backgroundColor: tokens.accent.base, opacity: saving ? 0.7 : 1 }]}
          borderless
        >
          <Text style={[styles.submitText, { color: tokens.text.onAccent }]}>
            {saving ? 'Salvando…' : 'Agendar aula'}
          </Text>
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
  row: { flexDirection: 'row', gap: spacing.md },
  rowItem: { flex: 1 },

  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', marginTop: spacing.sm, marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: fontSize.sm, fontWeight: '600' },

  submit: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitText: { fontSize: fontSize.md, fontWeight: '700' },
});
