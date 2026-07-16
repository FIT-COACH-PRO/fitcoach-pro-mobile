import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { List } from 'react-native-paper';
import { HomeScreen } from '../screens/HomeScreen';
import { WorkoutsScreen } from '../screens/WorkoutsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { navigationTheme, type AppTheme } from '../theme';

const Tab = createBottomTabNavigator();

export function AppNavigator({ theme }: { theme: AppTheme }) {
  const { tokens } = theme;

  return (
    <NavigationContainer theme={navigationTheme(theme)}>
      <Tab.Navigator
        screenOptions={{
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: tokens.surface.page,
            // divisor entre a nav bar e o conteúdo
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: tokens.surface.divider,
          },
          headerShadowVisible: false,
          headerTintColor: tokens.text.primary,
          tabBarStyle: {
            backgroundColor: tokens.surface.page,
            borderTopColor: tokens.surface.divider,
          },
          tabBarActiveTintColor: tokens.accent.base,
          tabBarInactiveTintColor: tokens.text.secondary,
        }}
      >
        <Tab.Screen
          name="Início"
          component={HomeScreen}
          options={{
            headerShown: false,
            tabBarIcon: (p) => <List.Icon {...p} icon="home" />,
          }}
        />
        <Tab.Screen
          name="Treinos"
          component={WorkoutsScreen}
          options={{ tabBarIcon: (p) => <List.Icon {...p} icon="dumbbell" /> }}
        />
        <Tab.Screen
          name="Config"
          component={SettingsScreen}
          options={{ tabBarIcon: (p) => <List.Icon {...p} icon="cog" /> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
