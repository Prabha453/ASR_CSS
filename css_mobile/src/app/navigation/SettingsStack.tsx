import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  AppPreferencesScreen,
  ChangePasswordScreen,
  CompanyProfileScreen,
  MasterDataListScreen,
  MasterSettingsScreen,
  SettingsHomeScreen,
  SharesSettingsScreen,
  UserSettingsScreen,
} from '@/features/settings';
import { SettingsStackParamList } from './types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsHome" component={SettingsHomeScreen} />
      <Stack.Screen name="CompanyProfile" component={CompanyProfileScreen} />
      <Stack.Screen name="SharesSettings" component={SharesSettingsScreen} />
      <Stack.Screen name="UserSettings" component={UserSettingsScreen} />
      <Stack.Screen name="MasterSettings" component={MasterSettingsScreen} />
      <Stack.Screen name="MasterDataList" component={MasterDataListScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="AppPreferences" component={AppPreferencesScreen} />
    </Stack.Navigator>
  );
}
