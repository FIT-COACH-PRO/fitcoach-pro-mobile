import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * A stack da Home concentra também as telas do hub "Mais" (financeiro, conta,
 * configurações). A aba "Mais" saiu da barra inferior para abrir espaço à
 * Comunidade no centro; o hub agora é acessível pelo botão no topo da Home.
 */
export type HomeStackParamList = {
  Home: undefined;
  Notificacoes: undefined;
  MaisHub: undefined;
  Financeiro: undefined;
  PagamentoForm: undefined;
  Configuracoes: undefined;
  PerfilForm: undefined;
  Produtividade: undefined;
};

/** Alias histórico: as telas do hub "Mais" vivem na stack da Home. */
export type MaisStackParamList = HomeStackParamList;

export type AlunosStackParamList = {
  AlunosList: undefined;
  AlunoDetalhe: { studentId: string };
  AlunoForm: { studentId?: string } | undefined;
  /** Histórico de peso/IMC (snapshots) do aluno. */
  AlunoProgresso: { studentId: string; studentName: string };
  /** Histórico de cargas por exercício; `exerciseName` abre já filtrado. */
  AlunoCargas: { studentId: string; studentName: string; exerciseName?: string };
};

export type TreinosStackParamList = {
  TreinosList: undefined;
  TreinoDetalhe: { workoutId: string };
  TreinoForm: undefined;
  /** Programas/mesociclos: bundles de treinos atribuíveis de uma vez. */
  Programas: undefined;
  ProgramaForm: undefined;
  /** Catálogo de exercícios e suas alternativas. */
  Exercicios: undefined;
  ExercicioSubstitutos: { exerciseId: string; exerciseName: string };
};

export type AgendaStackParamList = {
  AgendaList: undefined;
  AgendaForm: undefined;
};

export type ComunidadeStackParamList = {
  ComunidadeFeed: undefined;
  /** Publicação de aviso — só o admin chega aqui. */
  AvisoForm: undefined;
};

/**
 * Ordem da barra inferior: Home e Alunos à esquerda, Comunidade ao centro
 * (item elevado), Agenda e Treinos à direita.
 */
export type RootTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  AlunosTab: NavigatorScreenParams<AlunosStackParamList>;
  ComunidadeTab: NavigatorScreenParams<ComunidadeStackParamList>;
  AgendaTab: NavigatorScreenParams<AgendaStackParamList>;
  TreinosTab: NavigatorScreenParams<TreinosStackParamList>;
};
