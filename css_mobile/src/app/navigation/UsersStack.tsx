import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  UserFormScreen,
  UserGroupFormScreen,
  UserGroupListScreen,
  UserListScreen,
  UserPermissionsScreen,
  UsersHubScreen,
} from '@/features/users';
import { UsersStackParamList } from './types';

const Stack = createNativeStackNavigator<UsersStackParamList>();

export function UsersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UsersHub" component={UsersHubScreen} />
      <Stack.Screen name="UserList" component={UserListScreen} />
      <Stack.Screen name="UserForm" component={UserFormScreen} />
      <Stack.Screen name="UserPermissions" component={UserPermissionsScreen} />
      <Stack.Screen name="UserGroupList" component={UserGroupListScreen} />
      <Stack.Screen name="UserGroupForm" component={UserGroupFormScreen} />
    </Stack.Navigator>
  );
}
