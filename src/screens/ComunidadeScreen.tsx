import { Screen, ScreenHeader, EmptyState } from '../components/ui';

/**
 * Comunidade — rede social entre personais (troca de informações).
 * Feature planejada; a integração real fica a cargo do Matheus. Aqui é só o
 * espaço reservado no app, acessível pela aba "Mais".
 */
export function ComunidadeScreen({ onBack }: { onBack?: () => void }) {
  return (
    <Screen>
      <ScreenHeader title="Comunidade" subtitle="Rede dos personais" onBack={onBack} />
      <EmptyState
        icon="account-group-outline"
        title="Em breve"
        subtitle="Um espaço para os personais trocarem experiências e materiais. Em desenvolvimento."
      />
    </Screen>
  );
}
