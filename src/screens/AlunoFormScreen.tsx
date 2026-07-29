import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput, Text, TouchableRipple, ActivityIndicator } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader, ErrorState } from '../components/ui';
import { createStudent, updateStudent, getStudent } from '../api/endpoints';
import { parseMoney } from '../lib/forms';
import { useAppTheme, spacing, radius, fontSize } from '../theme';
import type { AlunosStackParamList } from '../navigation/types';
import type { Student } from '../types/database';

type Props = NativeStackScreenProps<AlunosStackParamList, 'AlunoForm'>;

const STATUS_OPTIONS: { value: Student['status']; label: string }[] = [
  { value: 'active', label: 'Ativo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'inactive', label: 'Inativo' },
];

export function AlunoFormScreen({ route, navigation }: Props) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const studentId = route.params?.studentId;
  const isEdit = !!studentId;

  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Student['status']>('active');
  const [objective, setObjective] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modo edição: carrega o aluno e preenche os campos.
  useEffect(() => {
    if (!studentId) return;
    let alive = true;
    (async () => {
      try {
        const s = await getStudent(studentId);
        if (!alive) return;
        setFullName(s.full_name);
        setWhatsapp(s.whatsapp);
        setEmail(s.email ?? '');
        setStatus(s.status);
        setObjective(s.objective ?? '');
        setMonthlyFee(s.monthly_fee != null ? String(s.monthly_fee) : '');
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Não foi possível carregar o aluno.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [studentId]);

  const onSubmit = async () => {
    const name = fullName.trim();
    const zap = whatsapp.trim();
    if (!name) return setError('Informe o nome do aluno.');
    if (!zap) return setError('Informe o WhatsApp do aluno.');

    setSaving(true);
    setError(null);
    const input = {
      full_name: name,
      whatsapp: zap,
      email: email.trim() || null,
      status,
      objective: objective.trim() || null,
      monthly_fee: parseMoney(monthlyFee),
    };
    try {
      if (studentId) {
        await updateStudent(studentId, input);
      } else {
        await createStudent(input);
      }
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar o aluno.');
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: tokens.surface.page }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top + spacing.lg }}>
        <ScreenHeader
          title={isEdit ? 'Editar aluno' : 'Novo aluno'}
          subtitle={isEdit ? 'Atualize os dados' : 'Cadastre um aluno'}
          onBack={navigation.goBack}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={tokens.accent.base} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextInput
            label="Nome completo *"
            value={fullName}
            onChangeText={setFullName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="WhatsApp *"
            value={whatsapp}
            onChangeText={setWhatsapp}
            keyboardType="phone-pad"
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
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

          <TextInput
            label="Objetivo"
            value={objective}
            onChangeText={setObjective}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={[styles.input, styles.multiline]}
          />
          <TextInput
            label="Mensalidade (R$)"
            value={monthlyFee}
            onChangeText={setMonthlyFee}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />

          {error && <ErrorState message={error} />}

          <TouchableRipple
            onPress={onSubmit}
            disabled={saving}
            style={[styles.submit, { backgroundColor: tokens.accent.base, opacity: saving ? 0.7 : 1 }]}
            borderless
          >
            <Text style={[styles.submitText, { color: tokens.text.onAccent }]}>
              {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Salvar aluno'}
            </Text>
          </TouchableRipple>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xs },
  input: { marginBottom: spacing.xs },
  multiline: { minHeight: 88 },

  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', marginTop: spacing.sm, marginBottom: spacing.xs },
  chips: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
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
