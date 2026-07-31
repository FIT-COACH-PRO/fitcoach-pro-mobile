import type { NavigatorScreenParams, CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type HomeStackParamList = {
  Home: undefined;
};

export type AlunosStackParamList = {
  AlunosList: undefined;
  AlunoDetalhe: { studentId: string };
  AlunoForm: { studentId?: string } | undefined;
};

export type TreinosStackParamList = {
  TreinosList: undefined;
  TreinoDetalhe: { workoutId: string };
  TreinoForm: undefined;
};

export type AgendaStackParamList = {
  AgendaList: undefined;
  AgendaForm: undefined;
};

/** Telas que viviam na antiga aba "Mais", agora atrás do avatar (tela Perfil). */
export type PerfilStackParamList = {
  PerfilHub: undefined;
  Financeiro: undefined;
  PagamentoForm: undefined;
  Configuracoes: undefined;
  PerfilForm: undefined;
};

export type RootTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  AlunosTab: NavigatorScreenParams<AlunosStackParamList>;
  ComunidadeTab: undefined;
  TreinosTab: NavigatorScreenParams<TreinosStackParamList>;
  AgendaTab: NavigatorScreenParams<AgendaStackParamList>;
};

/**
 * Stack raiz: as tabs, mais as telas alcançáveis de qualquer tab (avatar do
 * cabeçalho abre Perfil; sino abre Notificações) — ver redesign-dark-ui.md
 * Fase 2. Vivem aqui (não dentro de uma tab) porque precisam ser abertas a
 * partir de Home, Alunos, Treinos e Agenda por igual.
 */
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<RootTabParamList>;
  Notificacoes: undefined;
  Perfil: NavigatorScreenParams<PerfilStackParamList>;
};

/** Navigation prop de telas de tab que precisam abrir Notificações/Perfil (cabeçalho). */
export type HomeNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;
export type AlunosListNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<AlunosStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;
export type TreinosListNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<TreinosStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;
export type AgendaListNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<AgendaStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;
export type PerfilHubNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<PerfilStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;
