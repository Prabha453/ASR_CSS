import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTheme } from '@/shared/theme/ThemeContext';
import { AppDrawerContent } from './AppDrawerContent';
import { MainTabNavigator } from './MainTabNavigator';
import { AppDrawerParamList } from './types';

const Drawer = createDrawerNavigator<AppDrawerParamList>();

export function AppDrawerNavigator() {
  const { theme } = useTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 280,
          backgroundColor: theme.colors.card,
        },
        overlayColor: theme.colors.overlay,
        swipeEnabled: true,
        swipeEdgeWidth: 48,
      }}
    >
      <Drawer.Screen name="MainTabs" component={MainTabNavigator} />
    </Drawer.Navigator>
  );
}
