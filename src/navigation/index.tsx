import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';
import { navigationTheme, type AppTheme } from '../theme';
import type {
  HomeStackParamList,
  AlunosStackParamList,
  TreinosStackParamList,
  AgendaStackParamList,
  MaisStackParamList,
  RootTabParamList,
} from './types';

import { HomeScreen } from '../screens/HomeScreen';
import { NotificacoesScreen } from '../screens/NotificacoesScreen';
import { AlunosListScreen } from '../screens/AlunosListScreen';
import { AlunoDetalheScreen } from '../screens/AlunoDetalheScreen';
import { AlunoFormScreen } from '../screens/AlunoFormScreen';
import { WorkoutsScreen } from '../screens/WorkoutsScreen';
import { TreinoDetalheScreen } from '../screens/TreinoDetalheScreen';
import { WorkoutFormScreen } from '../screens/WorkoutFormScreen';
import { AgendaScreen } from '../screens/AgendaScreen';
import { AgendaFormScreen } from '../screens/AgendaFormScreen';
import { MaisScreen } from '../screens/MaisScreen';
import { FinanceiroScreen } from '../screens/FinanceiroScreen';
import { PagamentoFormScreen } from '../screens/PagamentoFormScreen';
import { ConfiguracoesScreen } from '../screens/ConfiguracoesScreen';
import { PerfilFormScreen } from '../screens/PerfilFormScreen';
import { ComunidadeScreen } from '../screens/ComunidadeScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const AlunosStack = createNativeStackNavigator<AlunosStackParamList>();
const TreinosStack = createNativeStackNavigator<TreinosStackParamList>();
const AgendaStack = createNativeStackNavigator<AgendaStackParamList>();
const MaisStack = createNativeStackNavigator<MaisStackParamList>();

const stackOptions = { headerShown: false } as const;

function HomeStackNav() {
  return (
    <HomeStack.Navigator screenOptions={stackOptions}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Notificacoes">
        {({ navigation }) => <NotificacoesScreen onBack={navigation.goBack} />}
      </HomeStack.Screen>
    </HomeStack.Navigator>
  );
}

function AlunosStackNav() {
  return (
    <AlunosStack.Navigator screenOptions={stackOptions}>
      <AlunosStack.Screen name="AlunosList" component={AlunosListScreen} />
      <AlunosStack.Screen name="AlunoDetalhe" component={AlunoDetalheScreen} />
      <AlunosStack.Screen name="AlunoForm" component={AlunoFormScreen} />
    </AlunosStack.Navigator>
  );
}

function TreinosStackNav() {
  return (
    <TreinosStack.Navigator screenOptions={stackOptions}>
      <TreinosStack.Screen name="TreinosList" component={WorkoutsScreen} />
      <TreinosStack.Screen name="TreinoDetalhe" component={TreinoDetalheScreen} />
      <TreinosStack.Screen name="TreinoForm" component={WorkoutFormScreen} />
    </TreinosStack.Navigator>
  );
}

function AgendaStackNav() {
  return (
    <AgendaStack.Navigator screenOptions={stackOptions}>
      <AgendaStack.Screen name="AgendaList" component={AgendaScreen} />
      <AgendaStack.Screen name="AgendaForm" component={AgendaFormScreen} />
    </AgendaStack.Navigator>
  );
}

function MaisStackNav() {
  return (
    <MaisStack.Navigator screenOptions={stackOptions}>
      <MaisStack.Screen name="MaisHub" component={MaisScreen} />
      <MaisStack.Screen name="Financeiro" component={FinanceiroScreen} />
      <MaisStack.Screen name="PagamentoForm" component={PagamentoFormScreen} />
      <MaisStack.Screen name="Notificacoes">
        {({ navigation }) => <NotificacoesScreen onBack={navigation.goBack} />}
      </MaisStack.Screen>
      <MaisStack.Screen name="Configuracoes" component={ConfiguracoesScreen} />
      <MaisStack.Screen name="PerfilForm" component={PerfilFormScreen} />
      <MaisStack.Screen name="Comunidade">
        {({ navigation }) => <ComunidadeScreen onBack={navigation.goBack} />}
      </MaisStack.Screen>
    </MaisStack.Navigator>
  );
}

const TAB_ICON: Record<keyof RootTabParamList, string> = {
  HomeTab: 'home',
  AlunosTab: 'account-group',
  TreinosTab: 'dumbbell',
  AgendaTab: 'calendar-blank-outline',
  MaisTab: 'dots-horizontal',
};

const TAB_LABEL: Record<keyof RootTabParamList, string> = {
  HomeTab: 'Home',
  AlunosTab: 'Alunos',
  TreinosTab: 'Treinos',
  AgendaTab: 'Agenda',
  MaisTab: 'Mais',
};

export function AppNavigator({ theme }: { theme: AppTheme }) {
  const { tokens } = theme;

  return (
    <NavigationContainer theme={navigationTheme(theme)}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarLabel: TAB_LABEL[route.name],
          tabBarIcon: ({ color, size }) => (
            <Icon source={TAB_ICON[route.name]} size={size} color={color} />
          ),
          tabBarStyle: {
            backgroundColor: tokens.surface.page,
            borderTopColor: tokens.surface.divider,
          },
          tabBarActiveTintColor: tokens.accent.base,
          tabBarInactiveTintColor: tokens.text.secondary,
        })}
      >
        <Tab.Screen name="HomeTab" component={HomeStackNav} />
        <Tab.Screen name="AlunosTab" component={AlunosStackNav} />
        <Tab.Screen name="TreinosTab" component={TreinosStackNav} />
        <Tab.Screen name="AgendaTab" component={AgendaStackNav} />
        <Tab.Screen name="MaisTab" component={MaisStackNav} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
