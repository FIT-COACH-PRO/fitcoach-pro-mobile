import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, type BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Icon, TouchableRipple } from 'react-native-paper';
import { navigationTheme, useAppTheme, type AppTheme } from '../theme';
import type {
  HomeStackParamList,
  AlunosStackParamList,
  TreinosStackParamList,
  AgendaStackParamList,
  PerfilStackParamList,
  RootTabParamList,
  RootStackParamList,
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
import { ComunidadeScreen } from '../screens/ComunidadeScreen';
import { PerfilScreen } from '../screens/PerfilScreen';
import { FinanceiroScreen } from '../screens/FinanceiroScreen';
import { PagamentoFormScreen } from '../screens/PagamentoFormScreen';
import { ConfiguracoesScreen } from '../screens/ConfiguracoesScreen';
import { PerfilFormScreen } from '../screens/PerfilFormScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const AlunosStack = createNativeStackNavigator<AlunosStackParamList>();
const TreinosStack = createNativeStackNavigator<TreinosStackParamList>();
const AgendaStack = createNativeStackNavigator<AgendaStackParamList>();
const PerfilStack = createNativeStackNavigator<PerfilStackParamList>();

const stackOptions = { headerShown: false } as const;

function HomeStackNav() {
  return (
    <HomeStack.Navigator screenOptions={stackOptions}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
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

/** Telas que viviam na antiga aba "Mais", agora atrás do avatar do cabeçalho. */
function PerfilStackNav() {
  return (
    <PerfilStack.Navigator screenOptions={stackOptions}>
      <PerfilStack.Screen name="PerfilHub" component={PerfilScreen} />
      <PerfilStack.Screen name="Financeiro" component={FinanceiroScreen} />
      <PerfilStack.Screen name="PagamentoForm" component={PagamentoFormScreen} />
      <PerfilStack.Screen name="Configuracoes" component={ConfiguracoesScreen} />
      <PerfilStack.Screen name="PerfilForm" component={PerfilFormScreen} />
    </PerfilStack.Navigator>
  );
}

const TAB_ICON: Record<keyof RootTabParamList, string> = {
  HomeTab: 'home',
  AlunosTab: 'account-group',
  ComunidadeTab: 'account-group-outline',
  TreinosTab: 'dumbbell',
  AgendaTab: 'calendar',
};

const TAB_LABEL: Record<keyof RootTabParamList, string> = {
  HomeTab: 'Home',
  AlunosTab: 'Alunos',
  ComunidadeTab: 'Comunidade',
  TreinosTab: 'Treinos',
  AgendaTab: 'Agenda',
};

/** Botão circular flutuante de 56px, elevado acima da tab bar (posição central — Comunidade). */
function CenterTabButton({ onPress, accessibilityState }: BottomTabBarButtonProps) {
  const { tokens } = useAppTheme();
  const selected = accessibilityState?.selected;
  return (
    <TouchableRipple
      onPress={onPress}
      style={styles.centerButtonWrapper}
      borderless
      accessibilityLabel={TAB_LABEL.ComunidadeTab}
    >
      <View
        style={[
          styles.centerButton,
          { backgroundColor: tokens.accent.base, borderColor: tokens.surface.page },
        ]}
      >
        <Icon
          source={TAB_ICON.ComunidadeTab}
          size={26}
          color={selected ? tokens.text.onAccent : tokens.text.onAccent}
        />
      </View>
    </TouchableRipple>
  );
}

function TabsNav() {
  const theme = useAppTheme();
  const { tokens } = theme;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarLabel: TAB_LABEL[route.name],
        tabBarIcon: ({ color, size }) => (
          <Icon source={TAB_ICON[route.name]} size={size} color={color} />
        ),
        tabBarStyle: {
          backgroundColor: tokens.surface.card,
          borderTopColor: tokens.surface.divider,
        },
        tabBarActiveTintColor: tokens.accent.base,
        tabBarInactiveTintColor: tokens.text.secondary,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNav} />
      <Tab.Screen name="AlunosTab" component={AlunosStackNav} />
      <Tab.Screen
        name="ComunidadeTab"
        component={ComunidadeScreen}
        options={{ tabBarButton: (props) => <CenterTabButton {...props} />, tabBarLabel: '' }}
      />
      <Tab.Screen name="TreinosTab" component={TreinosStackNav} />
      <Tab.Screen name="AgendaTab" component={AgendaStackNav} />
    </Tab.Navigator>
  );
}

export function AppNavigator({ theme }: { theme: AppTheme }) {
  return (
    <NavigationContainer theme={navigationTheme(theme)}>
      <RootStack.Navigator screenOptions={stackOptions}>
        <RootStack.Screen name="Tabs" component={TabsNav} />
        <RootStack.Screen name="Notificacoes">
          {({ navigation }) => <NotificacoesScreen onBack={navigation.goBack} />}
        </RootStack.Screen>
        <RootStack.Screen name="Perfil" component={PerfilStackNav} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centerButtonWrapper: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
