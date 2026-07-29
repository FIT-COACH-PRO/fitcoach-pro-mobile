import { useState } from 'react';
import { LoginScreen } from './LoginScreen';
import { SignupScreen } from './SignupScreen';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';

type AuthScreen = 'login' | 'signup' | 'forgot';

/** Alterna login / cadastro / recuperar senha enquanto o usuário está deslogado. */
export function AuthFlow() {
  const [screen, setScreen] = useState<AuthScreen>('login');

  if (screen === 'signup') return <SignupScreen onBack={() => setScreen('login')} />;
  if (screen === 'forgot') return <ForgotPasswordScreen onBack={() => setScreen('login')} />;
  return <LoginScreen onSignup={() => setScreen('signup')} onForgot={() => setScreen('forgot')} />;
}
