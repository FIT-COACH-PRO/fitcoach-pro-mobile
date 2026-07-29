import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput, Text, TouchableRipple } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { ScreenHeader, ErrorState } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize } from '../theme';

/** Mostrada quando o app é aberto via deep link de recuperação de senha (fitcoachpro://reset-password). */
export function ResetPasswordConfirmScreen({ onDone }: { onDone: () => void }) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (password.length < 6) return setError('A senha precisa ter ao menos 6 caracteres.');

    setSaving(true);
    setError(null);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateErr) return setError(updateErr.message);
    onDone();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: tokens.surface.page }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top + spacing.lg }}>
        <ScreenHeader title="Nova senha" subtitle="Defina uma nova senha para continuar" />
      </View>

      <View style={styles.content}>
        <TextInput
          label="Nova senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          mode="outlined"
          style={styles.input}
          right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword((v) => !v)} />}
        />

        {error && <ErrorState message={error} />}

        <TouchableRipple
          onPress={onSubmit}
          disabled={saving}
          style={[styles.submit, { backgroundColor: tokens.accent.base, opacity: saving ? 0.7 : 1 }]}
          borderless
        >
          <Text style={[styles.submitText, { color: tokens.text.onAccent }]}>
            {saving ? 'Salvando…' : 'Salvar nova senha'}
          </Text>
        </TouchableRipple>
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
});
