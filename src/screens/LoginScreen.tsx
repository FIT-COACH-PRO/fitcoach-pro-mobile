import { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme, spacing, radius, fontSize } from '../theme';

export function LoginScreen() {
  const { tokens } = useAppTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <View style={[styles.container, { backgroundColor: tokens.surface.page }]}>
      <Image
        source={require('../../assets/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={[styles.title, { color: tokens.text.primary }]}>FitCoach Pro</Text>

      <TextInput
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={[styles.input, { backgroundColor: tokens.surface.card }]}
      />
      <TextInput
        label="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={[styles.input, { backgroundColor: tokens.surface.card }]}
      />

      {error && <Text style={{ color: tokens.danger.base }}>{error}</Text>}

      <Button
        mode="contained"
        onPress={onSubmit}
        loading={loading}
        style={styles.button}
        buttonColor={tokens.accent.base}
        textColor={tokens.text.onAccent}
      >
        Entrar
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  logo: {
    width: 104,
    height: 104,
    borderRadius: radius.lg,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  input: { marginBottom: spacing.xs },
  button: { marginTop: spacing.md, borderRadius: radius.md },
});
