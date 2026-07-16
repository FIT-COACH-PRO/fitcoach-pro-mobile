import { Screen, ScreenHeader, EmptyState } from '../components/ui';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AlunosStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AlunosStackParamList, 'AlunoDetalhe'>;

// Preenchida no Bloco B.
export function AlunoDetalheScreen({ navigation }: Props) {
  return (
    <Screen>
      <ScreenHeader title="Aluno" onBack={navigation.goBack} />
      <EmptyState title="Em construção" />
    </Screen>
  );
}
