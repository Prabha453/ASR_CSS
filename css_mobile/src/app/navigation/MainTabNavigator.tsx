import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute, RouteProp } from '@react-navigation/native';
import { Platform, StyleSheet } from 'react-native';
import { TabBarButton, TabBarIcon } from '@/shared/components/navigation';
import { useTheme } from '@/shared/theme/ThemeContext';
import { MainTabParamList } from './types';
import { DashboardStack } from './DashboardStack';
import { EntitiesStack } from './EntitiesStack';
import { MessagesStack } from './MessagesStack';
import { UsersStack } from './UsersStack';
import { SettingsStack } from './SettingsStack';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ROOT_ROUTES = [
  'DashboardHome',
  'EntitiesHub',
  'CompanyList',
  'IndividualList',
  'MessagesList',
  'UsersHub',
  'SettingsHome',
];

function shouldHideTabBar(route: RouteProp<MainTabParamList>) {
  const focused = getFocusedRouteNameFromRoute(route);
  if (route.name === 'DashboardTab' && !focused) return false;
  return Boolean(focused && !TAB_ROOT_ROUTES.includes(focused));
}

export function MainTabNavigator() {
  const { theme } = useTheme();

  const baseTabBarStyle = {
    backgroundColor: theme.colors.card,
    borderTopColor: theme.colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: Platform.OS === 'ios' ? 84 : 68,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 10,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
        },
        tabBarIcon: ({ focused, color, size }) => (
          <TabBarIcon routeName={route.name} focused={focused} color={color} size={size} />
        ),
        tabBarButton: (props) => <TabBarButton {...props} />,
        tabBarStyle: shouldHideTabBar(route) ? { display: 'none' } : baseTabBarStyle,
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardStack} options={{ title: 'Home' }} />
      <Tab.Screen
        name="CompanyTab"
        component={EntitiesStack}
        options={{ title: 'Entities', popToTopOnBlur: true }}
        listeners={({ navigation }) => ({
          tabPress: (event) => {
            // Always open Entities hub — never restore Company/Individual list, etc.
            event.preventDefault();
            navigation.navigate('CompanyTab', { screen: 'EntitiesHub' });
          },
        })}
      />
      <Tab.Screen name="MessagesTab" component={MessagesStack} options={{ title: 'Messages' }} />
      <Tab.Screen name="UsersTab" component={UsersStack} options={{ title: 'Users' }} />
      <Tab.Screen name="SettingsTab" component={SettingsStack} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}
