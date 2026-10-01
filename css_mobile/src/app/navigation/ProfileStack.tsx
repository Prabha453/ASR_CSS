import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '@/features/profile';
import { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
