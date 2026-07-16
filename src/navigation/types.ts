import type { NavigatorScreenParams } from '@react-navigation/native';

export type HomeStackParamList = {
  Home: undefined;
  Notificacoes: undefined;
};

export type AlunosStackParamList = {
  AlunosList: undefined;
  AlunoDetalhe: { studentId: string };
};

export type TreinosStackParamList = {
  TreinosList: undefined;
  TreinoDetalhe: { workoutId: string };
};

export type MaisStackParamList = {
  MaisHub: undefined;
  Financeiro: undefined;
  Notificacoes: undefined;
  Configuracoes: undefined;
  Comunidade: undefined;
};

export type RootTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  AlunosTab: NavigatorScreenParams<AlunosStackParamList>;
  TreinosTab: NavigatorScreenParams<TreinosStackParamList>;
  AgendaTab: undefined;
  MaisTab: NavigatorScreenParams<MaisStackParamList>;
};
