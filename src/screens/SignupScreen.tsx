import { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput, Text, TouchableRipple } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { ScreenHeader, ErrorState } from '../components/ui';
import { brToIso } from '../lib/forms';
import { useAppTheme, spacing, radius, fontSize } from '../theme';

export function SignupScreen({ onBack }: { onBack: () => void }) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [cpf, setCpf] = useState('');
  const [cref, setCref] = useState('');
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async () => {
    const name = fullName.trim();
    const mail = email.trim();
    if (!name) return setError('Informe seu nome completo.');
    if (!mail) return setError('Informe seu e-mail.');
    if (password.length < 6) return setError('A senha precisa ter ao menos 6 caracteres.');
    if (!cpf.trim()) return setError('Informe seu CPF.');
    if (!whatsapp.trim()) return setError('Informe seu WhatsApp.');
    if (!city.trim()) return setError('Informe sua cidade.');
    if (!uf.trim()) return setError('Informe seu estado (UF).');

    const birth_date = brToIso(birthDate);
    if (birthDate.trim() && !birth_date) return setError('Data de nascimento inválida. Use DD/MM/AAAA.');

    setSaving(true);
    setError(null);
    const { data, error: signErr } = await signUp(mail, password, {
      full_name: name,
      cpf: cpf.trim(),
      cref: cref.trim(),
      whatsapp: whatsapp.trim(),
      city: city.trim(),
      state: uf.trim(),
      ...(birth_date ? { birth_date } : {}),
    });

    if (signErr) {
      setError(signErr.message);
      setSaving(false);
      return;
    }
    // Sem sessão = confirmação de e-mail exigida. Com sessão, o onAuthStateChange já loga.
    if (!data.session) {
      setDone(true);
      setSaving(false);
    }
  };

  if (done) {
    return (
      <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
        <ScreenHeader title="Quase lá" onBack={onBack} />
        <View style={styles.doneBox}>
          <Text style={[styles.doneTitle, { color: tokens.text.primary }]}>Confirme seu e-mail</Text>
          <Text style={[styles.doneText, { color: tokens.text.secondary }]}>
            Enviamos um link de confirmação para {email.trim()}. Confirme para entrar no app.
          </Text>
          <TouchableRipple onPress={onBack} style={[styles.submit, { backgroundColor: tokens.accent.base }]} borderless>
            <Text style={[styles.submitText, { color: tokens.text.onAccent }]}>Voltar para o login</Text>
          </TouchableRipple>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: tokens.surface.page }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top + spacing.lg }}>
        <ScreenHeader title="Criar conta" subtitle="Cadastro de personal" onBack={onBack} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput label="Nome completo *" value={fullName} onChangeText={setFullName} mode="outlined" style={styles.input} />
        <TextInput
          label="E-mail *"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Senha *"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          mode="outlined"
          style={styles.input}
          right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword((v) => !v)} />}
        />
        <TextInput label="WhatsApp *" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" mode="outlined" style={styles.input} />
        <TextInput label="CPF *" value={cpf} onChangeText={setCpf} keyboardType="numeric" mode="outlined" style={styles.input} />
        <TextInput label="CREF" value={cref} onChangeText={setCref} autoCapitalize="characters" mode="outlined" style={styles.input} />
        <View style={styles.row}>
          <TextInput label="Cidade *" value={city} onChangeText={setCity} mode="outlined" style={[styles.input, styles.cityItem]} />
          <TextInput
            label="UF *"
            value={uf}
            onChangeText={(t) => setUf(t.toUpperCase().slice(0, 2))}
            autoCapitalize="characters"
            maxLength={2}
            mode="outlined"
            style={[styles.input, styles.ufItem]}
          />
        </View>
        <TextInput
          label="Nascimento (DD/MM/AAAA)"
          value={birthDate}
          onChangeText={setBirthDate}
          keyboardType="numbers-and-punctuation"
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
            {saving ? 'Criando…' : 'Criar conta'}
          </Text>
        </TouchableRipple>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xs },
  input: { marginBottom: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.md },
  cityItem: { flex: 1 },
  ufItem: { width: 88 },

  submit: { borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
  submitText: { fontSize: fontSize.md, fontWeight: '700' },

  doneBox: { paddingHorizontal: spacing.lg, gap: spacing.md, marginTop: spacing.xl },
  doneTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  doneText: { fontSize: fontSize.md, lineHeight: 22 },
});
