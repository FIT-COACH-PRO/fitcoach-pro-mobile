import { Screen, ScreenHeader, EmptyState } from '../components/ui';

// Preenchida no Bloco E (redesenho: perfil, 2FA, tema, testar notif, agenda, sair).
export function ConfiguracoesScreen() {
  return (
    <Screen>
      <ScreenHeader title="Configurações" subtitle="Conta e preferências" />
      <EmptyState title="Em construção" />
    </Screen>
  );
}
