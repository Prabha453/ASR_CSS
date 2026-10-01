import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  DashboardTab: { active: 'home', inactive: 'home-outline' },
  CompanyTab: { active: 'business', inactive: 'business-outline' },
  MessagesTab: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
  UsersTab: { active: 'people', inactive: 'people-outline' },
  SettingsTab: { active: 'settings', inactive: 'settings-outline' },
};

type TabBarIconProps = {
  routeName: string;
  focused: boolean;
  color: string;
  size: number;
};

export function TabBarIcon({ routeName, focused, color, size }: TabBarIconProps) {
  const icons = TAB_ICONS[routeName];
  if (!icons) {
    return null;
  }

  return <Ionicons name={focused ? icons.active : icons.inactive} size={size} color={color} />;
}
