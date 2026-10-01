import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen, RecentActivityScreen } from '@/features/dashboard';
import { DashboardStackParamList } from './types';

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
      <Stack.Screen name="RecentActivity" component={RecentActivityScreen} />
    </Stack.Navigator>
  );
}
