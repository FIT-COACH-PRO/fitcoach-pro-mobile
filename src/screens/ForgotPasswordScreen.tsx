import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput, Text, TouchableRipple } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { ScreenHeader, ErrorState } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize } from '../theme';

export function ForgotPasswordScreen({ onBack }: { onBack: () => void }) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    const mail = email.trim();
    if (!mail) return setError('Informe seu e-mail.');

    setSaving(true);
    setError(null);
    const { error: resetErr } = await resetPassword(mail);
    if (resetErr) {
      setError(resetErr.message);
      setSaving(false);
      return;
    }
    setSent(true);
    setSaving(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: tokens.surface.page }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top + spacing.lg }}>
        <ScreenHeader title="Recuperar senha" subtitle="Enviaremos um link por e-mail" onBack={onBack} />
      </View>

      <View style={styles.content}>
        {sent ? (
          <>
            <Text style={[styles.sentTitle, { color: tokens.text.primary }]}>Link enviado</Text>
            <Text style={[styles.sentText, { color: tokens.text.secondary }]}>
              Se existir uma conta para {email.trim()}, enviamos um link para redefinir a senha. Confira
              seu e-mail (e a caixa de spam).
            </Text>
            <TouchableRipple onPress={onBack} style={[styles.submit, { backgroundColor: tokens.accent.base }]} borderless>
              <Text style={[styles.submitText, { color: tokens.text.onAccent }]}>Voltar para o login</Text>
            </TouchableRipple>
          </>
        ) : (
          <>
            <TextInput
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
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
                {saving ? 'Enviando…' : 'Enviar link'}
              </Text>
            </TouchableRipple>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md, marginTop: spacing.sm },
  input: { marginBottom: spacing.xs },
  submit: { borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
  submitText: { fontSize: fontSize.md, fontWeight: '700' },
  sentTitle: { fontSize: fontSize.lg, fontWeight: '700', marginTop: spacing.lg },
  sentText: { fontSize: fontSize.md, lineHeight: 22 },
});
