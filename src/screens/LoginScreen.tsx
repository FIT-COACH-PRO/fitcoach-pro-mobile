import { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Text, TouchableRipple } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize } from '../theme';

export function LoginScreen({ onSignup, onForgot }: { onSignup: () => void; onForgot: () => void }) {
  const { tokens } = useAppTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    const { error } = await signIn(email.trim(), password);
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tokens.surface.page }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.logo, { backgroundColor: tokens.success.base }]}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logoImg}
          resizeMode="contain"
        />
      </View>

      <Card style={styles.card}>
        <Text style={[styles.title, { color: tokens.text.primary }]}>Entrar na conta</Text>

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
          label="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          mode="outlined"
          style={styles.input}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword((v) => !v)}
            />
          }
        />

        <TouchableRipple
          onPress={onForgot}
          style={styles.forgot}
          borderless
        >
          <Text style={[styles.forgotText, { color: tokens.accent.base }]}>Esqueci minha senha</Text>
        </TouchableRipple>

        {error && <Text style={[styles.error, { color: tokens.danger.base }]}>{error}</Text>}

        <TouchableRipple
          onPress={onSubmit}
          disabled={loading}
          style={[styles.submit, { backgroundColor: tokens.accent.base, opacity: loading ? 0.7 : 1 }]}
          borderless
        >
          <Text style={[styles.submitText, { color: tokens.text.onAccent }]}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Text>
        </TouchableRipple>

        <View style={styles.signup}>
          <Text style={{ color: tokens.text.secondary }}>Não tem conta? </Text>
          <TouchableRipple
            onPress={onSignup}
            borderless
          >
            <Text style={[styles.signupLink, { color: tokens.accent.base }]}>Cadastre-se grátis</Text>
          </TouchableRipple>
        </View>
      </Card>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  logo: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: { width: 52, height: 52, borderRadius: radius.md },

  card: { gap: spacing.sm },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  input: { marginBottom: spacing.xs },
  forgot: { alignSelf: 'flex-end', paddingVertical: spacing.xs },
  forgotText: { fontSize: fontSize.sm, fontWeight: '600' },
  error: { fontSize: fontSize.sm },
  submit: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitText: { fontSize: fontSize.md, fontWeight: '700' },
  signup: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.sm },
  signupLink: { fontSize: fontSize.sm, fontWeight: '700' },
});
