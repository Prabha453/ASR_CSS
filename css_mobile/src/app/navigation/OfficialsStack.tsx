import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OfficialsHubScreen } from '@/features/officials';
import { OfficialsStackParamList } from './types';

const Stack = createNativeStackNavigator<OfficialsStackParamList>();

export function OfficialsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OfficialsHub" component={OfficialsHubScreen} />
    </Stack.Navigator>
  );
}
