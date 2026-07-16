import { Screen, ScreenHeader, EmptyState } from '../components/ui';

// Preenchida no Bloco E. Recebe onBack opcional (aberta pelo sino da Home ou pelo Mais).
export function NotificacoesScreen({ onBack }: { onBack?: () => void }) {
  return (
    <Screen>
      <ScreenHeader title="Notificações" subtitle="Atualizações importantes" onBack={onBack} />
      <EmptyState title="Em construção" />
    </Screen>
  );
}
