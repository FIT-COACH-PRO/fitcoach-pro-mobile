import { useEffect } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import {
  PaperProvider,
  ActivityIndicator,
  MD3LightTheme,
  MD3DarkTheme,
} from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from './src/hooks/useAuth';
import { registerForPushNotifications } from './src/lib/notifications';
import { AppNavigator } from './src/navigation';
import { LoginScreen } from './src/screens/LoginScreen';

export default function App() {
  const { user, loading } = useAuth();
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  useEffect(() => {
    if (user) {
      registerForPushNotifications().catch(() => {});
    }
  }, [user]);

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {loading ? (
        <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator />
        </View>
      ) : user ? (
        <AppNavigator dark={scheme === 'dark'} />
      ) : (
        <LoginScreen />
      )}
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
