import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { PaperProvider, ActivityIndicator } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from './src/hooks/useAuth';
import { registerForPushNotifications } from './src/lib/notifications';
import { AppNavigator } from './src/navigation';
import { LoginScreen } from './src/screens/LoginScreen';

export default function App() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) {
      registerForPushNotifications().catch(() => {});
    }
  }, [user]);

  return (
    <PaperProvider>
      <StatusBar style="auto" />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : user ? (
        <AppNavigator />
      ) : (
        <LoginScreen />
      )}
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
