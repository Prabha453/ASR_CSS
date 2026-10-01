import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IndividualListScreen } from '@/features/individual';
import { IndividualStackParamList } from './types';

const Stack = createNativeStackNavigator<IndividualStackParamList>();

export function IndividualStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="IndividualList" component={IndividualListScreen} />
    </Stack.Navigator>
  );
}
