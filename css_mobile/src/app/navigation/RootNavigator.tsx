import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Loader } from '@/shared/components/common';
import { useAppSelector } from '@/app/store/hooks';
import { AuthNavigator } from './AuthNavigator';
import { AppDrawerNavigator } from './AppDrawerNavigator';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isHydrated = useAppSelector((state) => state.auth.isHydrated);

  if (!isHydrated) {
    return <Loader fullScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={AppDrawerNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
