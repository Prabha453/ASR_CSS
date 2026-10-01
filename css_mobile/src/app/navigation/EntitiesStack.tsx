import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  CompanyAddScreen,
  CompanyListScreen,
  CompanyViewScreen,
  EntityShareFormScreen,
} from '@/features/company';
import {
  ChargesListScreen,
  EntitiesHubScreen,
  ModulePlaceholderScreen,
} from '@/features/entities';
import {
  IndividualAddScreen,
  IndividualListScreen,
  IndividualViewScreen,
} from '@/features/individual';
import { OfficialsDetailScreen } from '@/features/officials';
import { EntitiesStackParamList } from './types';

const Stack = createNativeStackNavigator<EntitiesStackParamList>();

export function EntitiesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EntitiesHub" component={EntitiesHubScreen} />
      <Stack.Screen name="IndividualList" component={IndividualListScreen} />
      <Stack.Screen name="IndividualView" component={IndividualViewScreen} />
      <Stack.Screen name="IndividualAdd" component={IndividualAddScreen} />
      <Stack.Screen name="CompanyList" component={CompanyListScreen} />
      <Stack.Screen name="CompanyView" component={CompanyViewScreen} />
      <Stack.Screen name="CompanyAdd" component={CompanyAddScreen} />
      <Stack.Screen name="EntityShareForm" component={EntityShareFormScreen} />
      <Stack.Screen name="OfficialsDetail" component={OfficialsDetailScreen} />
      <Stack.Screen name="ChargesList" component={ChargesListScreen} />
      <Stack.Screen name="ModulePlaceholder" component={ModulePlaceholderScreen} />
    </Stack.Navigator>
  );
}
