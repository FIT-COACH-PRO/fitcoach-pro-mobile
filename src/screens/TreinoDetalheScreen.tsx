import { Screen, ScreenHeader, EmptyState } from '../components/ui';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TreinosStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<TreinosStackParamList, 'TreinoDetalhe'>;

// Preenchida no Bloco C.
export function TreinoDetalheScreen({ navigation }: Props) {
  return (
    <Screen>
      <ScreenHeader title="Treino" onBack={navigation.goBack} />
      <EmptyState title="Em construção" />
    </Screen>
  );
}
