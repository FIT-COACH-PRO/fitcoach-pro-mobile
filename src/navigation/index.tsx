import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import {
  createBottomTabNavigator,
  type BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Icon, Text } from 'react-native-paper';
import { navigationTheme, spacing, radius, fontSize, touch, type AppTheme } from '../theme';
import type {
  HomeStackParamList,
  AlunosStackParamList,
  TreinosStackParamList,
  AgendaStackParamList,
  ComunidadeStackParamList,
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
import { AvisoFormScreen } from '../screens/AvisoFormScreen';
import { ProdutividadeScreen } from '../screens/ProdutividadeScreen';
import { ProgressoScreen } from '../screens/ProgressoScreen';
import { CargasScreen } from '../screens/CargasScreen';
import { ProgramasScreen } from '../screens/ProgramasScreen';
import { ProgramaFormScreen } from '../screens/ProgramaFormScreen';
import { ExerciciosScreen } from '../screens/ExerciciosScreen';
import { ExercicioSubstitutosScreen } from '../screens/ExercicioSubstitutosScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const AlunosStack = createNativeStackNavigator<AlunosStackParamList>();
const TreinosStack = createNativeStackNavigator<TreinosStackParamList>();
const AgendaStack = createNativeStackNavigator<AgendaStackParamList>();
const ComunidadeStack = createNativeStackNavigator<ComunidadeStackParamList>();

const stackOptions = { headerShown: false } as const;

function HomeStackNav() {
  return (
    <HomeStack.Navigator screenOptions={stackOptions}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Notificacoes">
        {({ navigation }) => <NotificacoesScreen onBack={navigation.goBack} />}
      </HomeStack.Screen>
      <HomeStack.Screen name="MaisHub" component={MaisScreen} />
      <HomeStack.Screen name="Financeiro" component={FinanceiroScreen} />
      <HomeStack.Screen name="PagamentoForm" component={PagamentoFormScreen} />
      <HomeStack.Screen name="Configuracoes" component={ConfiguracoesScreen} />
      <HomeStack.Screen name="PerfilForm" component={PerfilFormScreen} />
      <HomeStack.Screen name="Produtividade" component={ProdutividadeScreen} />
    </HomeStack.Navigator>
  );
}

function AlunosStackNav() {
  return (
    <AlunosStack.Navigator screenOptions={stackOptions}>
      <AlunosStack.Screen name="AlunosList" component={AlunosListScreen} />
      <AlunosStack.Screen name="AlunoDetalhe" component={AlunoDetalheScreen} />
      <AlunosStack.Screen name="AlunoForm" component={AlunoFormScreen} />
      <AlunosStack.Screen name="AlunoProgresso" component={ProgressoScreen} />
      <AlunosStack.Screen name="AlunoCargas" component={CargasScreen} />
    </AlunosStack.Navigator>
  );
}

function TreinosStackNav() {
  return (
    <TreinosStack.Navigator screenOptions={stackOptions}>
      <TreinosStack.Screen name="TreinosList" component={WorkoutsScreen} />
      <TreinosStack.Screen name="TreinoDetalhe" component={TreinoDetalheScreen} />
      <TreinosStack.Screen name="TreinoForm" component={WorkoutFormScreen} />
      <TreinosStack.Screen name="Programas" component={ProgramasScreen} />
      <TreinosStack.Screen name="ProgramaForm" component={ProgramaFormScreen} />
      <TreinosStack.Screen name="Exercicios" component={ExerciciosScreen} />
      <TreinosStack.Screen name="ExercicioSubstitutos" component={ExercicioSubstitutosScreen} />
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

function ComunidadeStackNav() {
  return (
    <ComunidadeStack.Navigator screenOptions={stackOptions}>
      <ComunidadeStack.Screen name="ComunidadeFeed" component={ComunidadeScreen} />
      <ComunidadeStack.Screen name="AvisoForm" component={AvisoFormScreen} />
    </ComunidadeStack.Navigator>
  );
}

const TAB_ICON: Record<keyof RootTabParamList, string> = {
  HomeTab: 'home',
  AlunosTab: 'account-group',
  ComunidadeTab: 'forum',
  AgendaTab: 'calendar-blank-outline',
  TreinosTab: 'dumbbell',
};

const TAB_LABEL: Record<keyof RootTabParamList, string> = {
  HomeTab: 'Home',
  AlunosTab: 'Alunos',
  ComunidadeTab: 'Comunidade',
  AgendaTab: 'Agenda',
  TreinosTab: 'Treinos',
};

/**
 * Altura útil da barra (sem o safe-area inferior). Os quatro itens comuns
 * ficam alinhados na régua padrão — deslocados para baixo por CENTER_LIFT —
 * enquanto o botão da Comunidade ocupa o topo da barra, elevado acima deles.
 */
const BAR_HEIGHT = 86;
const CENTER_SIZE = 56;
const CENTER_LIFT = 18;

/**
 * Botão central da Comunidade: círculo elevado acima da linha dos demais itens,
 * com anel na cor do fundo para descolar da superfície. Usa só tokens do tema.
 */
function centerTabButton(theme: AppTheme) {
  const { tokens } = theme;

  return function CenterTabButton({
    onPress,
    onLongPress,
    accessibilityState,
  }: BottomTabBarButtonProps) {
    const focused = accessibilityState?.selected ?? false;

    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityRole="button"
        accessibilityState={accessibilityState}
        accessibilityLabel={TAB_LABEL.ComunidadeTab}
        style={styles.centerSlot}
        android_ripple={{ color: tokens.accent.subtle, borderless: true }}
      >
        <View
          style={[
            styles.centerCircle,
            {
              backgroundColor: focused ? tokens.accent.base : tokens.accent.hover,
              borderColor: tokens.surface.page,
              shadowColor: tokens.surface.frame,
            },
          ]}
        >
          <Icon source={TAB_ICON.ComunidadeTab} size={28} color={tokens.text.onAccent} />
        </View>
        <Text
          style={[
            styles.centerLabel,
            { color: focused ? tokens.accent.base : tokens.text.secondary },
          ]}
          numberOfLines={1}
        >
          {TAB_LABEL.ComunidadeTab}
        </Text>
      </Pressable>
    );
  };
}

export function AppNavigator({ theme }: { theme: AppTheme }) {
  const { tokens } = theme;
  const insets = useSafeAreaInsets();

  return (
    <NavigationContainer theme={navigationTheme(theme)}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarLabel: TAB_LABEL[route.name],
          tabBarIcon: ({ color }) => (
            <Icon source={TAB_ICON[route.name]} size={touch.tabIcon} color={color} />
          ),
          tabBarStyle: {
            backgroundColor: tokens.surface.page,
            borderTopColor: tokens.surface.divider,
            height: BAR_HEIGHT + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 0,
          },
          // Os quatro itens comuns descem para a régua padrão; o central, não.
          tabBarItemStyle: { paddingTop: CENTER_LIFT, paddingBottom: spacing.sm },
          tabBarLabelStyle: styles.tabLabel,
          tabBarActiveTintColor: tokens.accent.base,
          tabBarInactiveTintColor: tokens.text.secondary,
        })}
      >
        <Tab.Screen name="HomeTab" component={HomeStackNav} />
        <Tab.Screen name="AlunosTab" component={AlunosStackNav} />
        <Tab.Screen
          name="ComunidadeTab"
          component={ComunidadeStackNav}
          options={{ tabBarItemStyle: styles.centerItem, tabBarButton: centerTabButton(theme) }}
        />
        <Tab.Screen name="AgendaTab" component={AgendaStackNav} />
        <Tab.Screen name="TreinosTab" component={TreinosStackNav} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabLabel: { fontSize: fontSize.xs, fontWeight: '600', marginTop: spacing.xs },

  centerItem: { paddingTop: 0, paddingBottom: 0 },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.xs,
  },
  centerCircle: {
    width: CENTER_SIZE,
    height: CENTER_SIZE,
    borderRadius: radius.pill,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    // A sombra reforça a leitura de "botão elevado" sobre a barra.
    elevation: 6,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  centerLabel: { fontSize: fontSize.xs, fontWeight: '600', marginTop: spacing.xs },
});
