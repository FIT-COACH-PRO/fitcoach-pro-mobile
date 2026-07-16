import { useEffect } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { PaperProvider, ActivityIndicator } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from './src/hooks/useAuth';
import { registerForPushNotifications } from './src/lib/notifications';
import { AppNavigator } from './src/navigation';
import { LoginScreen } from './src/screens/LoginScreen';
import { lightTheme, darkTheme } from './src/theme';

export default function App() {
  const { user, loading } = useAuth();
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    if (user) {
      registerForPushNotifications().catch(() => {});
    }
  }, [user]);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        {loading ? (
          <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
            <ActivityIndicator color={theme.tokens.accent.base} />
          </View>
        ) : user ? (
          <AppNavigator theme={theme} />
        ) : (
          <LoginScreen />
        )}
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
