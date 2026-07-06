import { View, StyleSheet } from 'react-native';
import { Button, Text, Divider } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { sendLocalNotification } from '../lib/notifications';
import { requestCalendarPermission } from '../lib/calendar';

export function SettingsScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text variant="titleMedium">Conta</Text>
      <Text variant="bodyMedium">{user?.email}</Text>
      <Divider style={styles.divider} />

      <Button
        mode="outlined"
        onPress={() => sendLocalNotification('Teste', 'Notificação local funcionando ✅')}
      >
        Testar notificação
      </Button>
      <Button mode="outlined" onPress={() => requestCalendarPermission()}>
        Permitir acesso à agenda
      </Button>

      <Divider style={styles.divider} />
      <Button mode="contained" buttonColor="#d32f2f" onPress={signOut}>
        Sair
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  divider: { marginVertical: 8 },
});
