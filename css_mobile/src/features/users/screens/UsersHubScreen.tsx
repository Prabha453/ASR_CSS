import { ComponentProps } from 'react';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { UsersStackParamList } from '@/app/navigation/types';
import { AppHeader, ScreenShell } from '@/shared/components/layout';
import { EnterpriseListRow } from '@/shared/components/common/EnterpriseListRow';
import { IconTokenKey } from '@/shared/theme/iconTokens';
import { designSystem, textStyles } from '@/shared/theme/designSystem';
import { SettingsGroupSection } from '@/features/settings/components';
import { useTheme } from '@/shared/theme/ThemeContext';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

type Props = NativeStackScreenProps<UsersStackParamList, 'UsersHub'>;

const USER_MENU: {
  id: string;
  title: string;
  subtitle: string;
  icon: IoniconsName;
  iconToken: IconTokenKey;
  route: 'UserList' | 'UserGroupList';
}[] = [
  {
    id: 'users',
    title: 'Users',
    subtitle: 'Manage user accounts and access',
    icon: 'person-outline',
    iconToken: 'primary',
    route: 'UserList',
  },
  {
    id: 'user-groups',
    title: 'User Groups',
    subtitle: 'Roles and module permissions',
    icon: 'people-outline',
    iconToken: 'purple',
    route: 'UserGroupList',
  },
];

export function UsersHubScreen({ navigation }: Props) {
  const { theme } = useTheme();

  return (
    <ScreenShell
      contentStyle={{ paddingTop: designSystem.screenPadding }}
      header={
        <AppHeader
          title="Users"
          leftAction="menu"
          showNotifications
          showProfile
          profileInitials="AS"
        />
      }
    >
      <Text
        style={[
          textStyles.description,
          { color: theme.colors.textMuted, marginBottom: designSystem.sectionGap },
        ]}
      >
        Manage users, groups and permissions
      </Text>

      <SettingsGroupSection title="USER MANAGEMENT">
        {USER_MENU.map((item, index) => (
          <EnterpriseListRow
            key={item.id}
            title={item.title}
            description={item.subtitle}
            icon={item.icon}
            iconToken={item.iconToken}
            showDivider={index < USER_MENU.length - 1}
            onPress={() => navigation.navigate(item.route)}
          />
        ))}
      </SettingsGroupSection>
    </ScreenShell>
  );
}
