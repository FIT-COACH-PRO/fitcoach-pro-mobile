import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput, Text, TouchableRipple, ActivityIndicator, Icon } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader, ErrorState } from '../components/ui';
import { createStudent, updateStudent, getStudent } from '../api/endpoints';
import { parseMoney, maskWhatsapp, brToIso, isoToBr } from '../lib/forms';
import { useAppTheme, spacing, radius, fontSize } from '../theme';
import type { AlunosStackParamList } from '../navigation/types';
import type { Student } from '../types/database';

type Props = NativeStackScreenProps<AlunosStackParamList, 'AlunoForm'>;

const STATUS_OPTIONS: { value: Student['status']; label: string }[] = [
  { value: 'active', label: 'Ativo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'inactive', label: 'Inativo' },
];

const GENDER_OPTIONS: { value: NonNullable<Student['gender']>; label: string }[] = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Feminino' },
  { value: 'other', label: 'Outro' },
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
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Student['gender']>(null);
  const [objective, setObjective] = useState('');
  const [observations, setObservations] = useState('');
  const [subscriptionStart, setSubscriptionStart] = useState('');
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
        setWhatsapp(maskWhatsapp(s.whatsapp));
        setEmail(s.email ?? '');
        setStatus(s.status);
        setBirthDate(isoToBr(s.birth_date));
        setGender(s.gender);
        setObjective(s.objective ?? '');
        setObservations(s.observations ?? '');
        setSubscriptionStart(isoToBr(s.subscription_start));
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

    const birthIso = birthDate.trim() ? brToIso(birthDate) : null;
    if (birthDate.trim() && !birthIso) return setError('Data de nascimento inválida. Use DD/MM/AAAA.');

    const subscriptionIso = subscriptionStart.trim() ? brToIso(subscriptionStart) : null;
    if (subscriptionStart.trim() && !subscriptionIso) {
      return setError('Data de início inválida. Use DD/MM/AAAA.');
    }

    setSaving(true);
    setError(null);
    const input = {
      full_name: name,
      whatsapp: zap,
      email: email.trim() || null,
      status,
      birth_date: birthIso,
      gender,
      objective: objective.trim() || null,
      observations: observations.trim() || null,
      subscription_start: subscriptionIso,
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
            onChangeText={(t) => setWhatsapp(maskWhatsapp(t))}
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
          <TextInput
            label="Data de Nascimento (DD/MM/AAAA)"
            value={birthDate}
            onChangeText={setBirthDate}
            keyboardType="numbers-and-punctuation"
            mode="outlined"
            style={styles.input}
          />

          <Text style={[styles.fieldLabel, { color: tokens.text.secondary }]}>Sexo</Text>
          <View style={styles.chips}>
            {GENDER_OPTIONS.map((opt) => {
              const selected = gender === opt.value;
              return (
                <TouchableRipple
                  key={opt.value}
                  onPress={() => setGender(selected ? null : opt.value)}
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

          {isEdit && (
            <>
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
            </>
          )}

          <TextInput
            label="Plano de Treino"
            value={objective}
            onChangeText={setObjective}
            mode="outlined"
            placeholder="Ex.: Hipertrofia - 3x/sem"
            style={styles.input}
          />
          <TextInput
            label="Data de Início (DD/MM/AAAA)"
            value={subscriptionStart}
            onChangeText={setSubscriptionStart}
            keyboardType="numbers-and-punctuation"
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Mensalidade (R$)"
            value={monthlyFee}
            onChangeText={setMonthlyFee}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Notas e Objetivos"
            value={observations}
            onChangeText={setObservations}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={[styles.input, styles.multiline]}
          />

          <TouchableRipple
            disabled
            style={[styles.photosBtn, { borderColor: tokens.surface.divider }]}
            borderless
          >
            <View style={styles.photosInner}>
              <Icon source="camera-outline" size={18} color={tokens.text.muted} />
              <Text style={[styles.photosText, { color: tokens.text.muted }]}>
                Adicionar Fotos de Avaliação — Em breve
              </Text>
            </View>
          </TouchableRipple>

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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: fontSize.sm, fontWeight: '600' },

  photosBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  photosInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  photosText: { fontSize: fontSize.sm, fontWeight: '600' },

  submit: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitText: { fontSize: fontSize.md, fontWeight: '700' },
});
