import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { List } from 'react-native-paper';
import { HomeScreen } from '../screens/HomeScreen';
import { WorkoutsScreen } from '../screens/WorkoutsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
        <Tab.Screen
          name="Início"
          component={HomeScreen}
          options={{ tabBarIcon: (p) => <List.Icon {...p} icon="home" /> }}
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
