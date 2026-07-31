import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput, Text, TouchableRipple, ActivityIndicator } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader, ErrorState, EmptyState } from '../components/ui';
import { createPayment, listStudents } from '../api/endpoints';
import { parseMoney, brToIso, todayBR } from '../lib/forms';
import { useAppTheme, spacing, radius, fontSize } from '../theme';
import type { PerfilStackParamList } from '../navigation/types';
import type { Student, Payment } from '../types/database';

type Props = NativeStackScreenProps<PerfilStackParamList, 'PagamentoForm'>;

const STATUS_OPTIONS: { value: Payment['status']; label: string }[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'paid', label: 'Pago' },
  { value: 'overdue', label: 'Atrasado' },
];

const METHOD_OPTIONS: { value: NonNullable<Payment['payment_method']>; label: string }[] = [
  { value: 'pix', label: 'Pix' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'transfer', label: 'Transferência' },
  { value: 'card', label: 'Cartão' },
  { value: 'other', label: 'Outro' },
];

export function PagamentoFormScreen({ navigation }: Props) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [students, setStudents] = useState<Student[] | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(todayBR());
  const [status, setStatus] = useState<Payment['status']>('pending');
  const [method, setMethod] = useState<NonNullable<Payment['payment_method']> | null>(null);
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
    const value = parseMoney(amount);
    if (value == null || value <= 0) return setError('Informe um valor válido.');
    const iso = brToIso(dueDate);
    if (!iso) return setError('Vencimento inválido. Use DD/MM/AAAA.');

    setSaving(true);
    setError(null);
    try {
      await createPayment({
        student_id: studentId,
        amount: value,
        due_date: iso,
        status,
        payment_method: method ?? undefined,
        // Pagamento já quitado registra a data de hoje.
        payment_date: status === 'paid' ? new Date().toISOString().slice(0, 10) : null,
      });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar o pagamento.');
      setSaving(false);
    }
  };

  const header = (
    <View style={{ paddingTop: insets.top + spacing.lg }}>
      <ScreenHeader title="Novo pagamento" subtitle="Registre um lançamento" onBack={navigation.goBack} />
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
          subtitle="Cadastre um aluno antes de registrar um pagamento."
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
                  style={[
                    styles.chipText,
                    { color: selected ? tokens.text.onAccent : tokens.text.secondary },
                  ]}
                >
                  {s.full_name}
                </Text>
              </TouchableRipple>
            );
          })}
        </View>

        <TextInput
          label="Valor (R$) *"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Vencimento (DD/MM/AAAA) *"
          value={dueDate}
          onChangeText={setDueDate}
          keyboardType="numbers-and-punctuation"
          mode="outlined"
          style={styles.input}
        />

        <Text style={[styles.fieldLabel, { color: tokens.text.secondary }]}>Status</Text>
        <View style={styles.chips}>
          {STATUS_OPTIONS.map((opt) => {
            const selected = status === opt.value;
            return (
              <TouchableRipple
                key={opt.value}
                onPress={() => setStatus(opt.value)}
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
                  {opt.label}
                </Text>
              </TouchableRipple>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, { color: tokens.text.secondary }]}>Forma de pagamento</Text>
        <View style={styles.chips}>
          {METHOD_OPTIONS.map((opt) => {
            const selected = method === opt.value;
            return (
              <TouchableRipple
                key={opt.value}
                onPress={() => setMethod(selected ? null : opt.value)}
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
                  {opt.label}
                </Text>
              </TouchableRipple>
            );
          })}
        </View>

        {error && <ErrorState message={error} />}

        <TouchableRipple
          onPress={onSubmit}
          disabled={saving}
          style={[styles.submit, { backgroundColor: tokens.accent.base, opacity: saving ? 0.7 : 1 }]}
          borderless
        >
          <Text style={[styles.submitText, { color: tokens.text.onAccent }]}>
            {saving ? 'Salvando…' : 'Salvar pagamento'}
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
