import { Screen, ScreenHeader, EmptyState } from '../components/ui';

// Preenchida no Bloco F (hub: Financeiro, Notificações, Configurações, Comunidade).
export function MaisScreen() {
  return (
    <Screen>
      <ScreenHeader title="Mais" subtitle="Ferramentas e conta" />
      <EmptyState title="Em construção" />
    </Screen>
  );
}
