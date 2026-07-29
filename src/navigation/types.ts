import type { NavigatorScreenParams } from '@react-navigation/native';

export type HomeStackParamList = {
  Home: undefined;
  Notificacoes: undefined;
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

export type MaisStackParamList = {
  MaisHub: undefined;
  Financeiro: undefined;
  PagamentoForm: undefined;
  Notificacoes: undefined;
  Configuracoes: undefined;
  PerfilForm: undefined;
  Comunidade: undefined;
};

export type RootTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  AlunosTab: NavigatorScreenParams<AlunosStackParamList>;
  TreinosTab: NavigatorScreenParams<TreinosStackParamList>;
  AgendaTab: NavigatorScreenParams<AgendaStackParamList>;
  MaisTab: NavigatorScreenParams<MaisStackParamList>;
};
