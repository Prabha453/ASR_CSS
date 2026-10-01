import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MessagesListScreen } from '@/features/messages';
import { MessagesStackParamList } from './types';

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MessagesList" component={MessagesListScreen} />
    </Stack.Navigator>
  );
}
