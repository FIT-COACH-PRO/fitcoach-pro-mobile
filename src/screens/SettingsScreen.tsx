import { View, StyleSheet } from 'react-native';
import { Button, Text, Divider } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { sendLocalNotification } from '../lib/notifications';
import { requestCalendarPermission } from '../lib/calendar';
import { useAppTheme, spacing, radius, fontSize } from '../theme';

export function SettingsScreen() {
  const { tokens } = useAppTheme();
  const { user, signOut } = useAuth();

  // Botão secundário: fill surface.card + borda surface.divider + texto text.primary.
  const secondary = {
    style: [styles.button, { borderColor: tokens.surface.divider }],
    buttonColor: tokens.surface.card,
    textColor: tokens.text.primary,
  };

  return (
    <View style={[styles.container, { backgroundColor: tokens.surface.page }]}>
      <Text style={[styles.sectionTitle, { color: tokens.text.primary }]}>Conta</Text>
      <Text style={{ color: tokens.text.secondary }}>{user?.email}</Text>

      <Divider style={[styles.divider, { backgroundColor: tokens.surface.divider }]} />

      <Button
        mode="outlined"
        {...secondary}
        onPress={() => sendLocalNotification('Teste', 'Notificação local funcionando ✅')}
      >
        Testar notificação
      </Button>
      <Button mode="outlined" {...secondary} onPress={() => requestCalendarPermission()}>
        Permitir acesso à agenda
      </Button>

      <Divider style={[styles.divider, { backgroundColor: tokens.surface.divider }]} />

      <Button
        mode="contained"
        style={styles.button}
        buttonColor={tokens.danger.base}
        textColor={tokens.text.onDark}
        onPress={signOut}
      >
        Sair
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, gap: spacing.md },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700' },
  divider: { marginVertical: spacing.sm },
  button: { borderRadius: radius.md },
});
