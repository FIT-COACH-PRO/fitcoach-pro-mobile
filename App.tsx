import { useEffect } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { PaperProvider, ActivityIndicator } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from './src/hooks/useAuth';
import { useAuthDeepLink } from './src/hooks/useAuthDeepLink';
import { registerForPushNotifications } from './src/lib/notifications';
import { AppNavigator } from './src/navigation';
import { AuthFlow } from './src/screens/AuthFlow';
import { ResetPasswordConfirmScreen } from './src/screens/ResetPasswordConfirmScreen';
import { lightTheme, darkTheme } from './src/theme';
import { ThemeModeProvider, useThemeMode } from './src/theme/ThemeMode';

function Root() {
  const { user, loading } = useAuth();
  const { recoveryPending, clearRecovery } = useAuthDeepLink();
  const { mode } = useThemeMode();
  const scheme = useColorScheme();
  const isDark = mode === 'system' ? scheme === 'dark' : mode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    if (user) {
      registerForPushNotifications().catch(() => {});
    }
  }, [user]);

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {recoveryPending ? (
        <ResetPasswordConfirmScreen onDone={clearRecovery} />
      ) : loading ? (
        <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator color={theme.tokens.accent.base} />
        </View>
      ) : user ? (
        <AppNavigator theme={theme} />
      ) : (
        <AuthFlow />
      )}
    </PaperProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeModeProvider>
        <Root />
      </ThemeModeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
