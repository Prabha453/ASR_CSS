import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '@/app/store/hooks';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { getProfileInitials } from '@/features/settings/utils/settings.utils';
import { IconCircle } from '@/shared/components/common/IconCircle';
import { designSystem, textStyles } from '@/shared/theme/designSystem';
import { IconName, IconTokenKey } from '@/shared/theme/iconTokens';
import { fontWeight } from '@/shared/theme/typography';
import { useTheme } from '@/shared/theme/ThemeContext';
import { MainTabParamList } from './types';

const logoDark = require('@/assets/images/logo-dark.png');

type DrawerNavTarget = {
  tab: keyof MainTabParamList;
  screen?: string;
  params?: Record<string, unknown>;
};

type DrawerChildItem = {
  id: string;
  title: string;
  icon: IconName;
  target: DrawerNavTarget;
};

type DrawerMenuItem =
  | {
      id: string;
      title: string;
      subtitle?: string;
      icon: IconName;
      iconToken: IconTokenKey;
      kind: 'link';
      target: DrawerNavTarget;
    }
  | {
      id: string;
      title: string;
      subtitle?: string;
      icon: IconName;
      iconToken: IconTokenKey;
      kind: 'group';
      children: DrawerChildItem[];
    };

const DRAWER_MENU: DrawerMenuItem[] = [
  {
    id: 'home',
    title: 'Dashboard',
    subtitle: 'Overview & insights',
    icon: 'home-outline',
    iconToken: 'primary',
    kind: 'link',
    target: { tab: 'DashboardTab', screen: 'DashboardHome' },
  },
  {
    id: 'entities',
    title: 'Entity Management',
    subtitle: 'Companies, charges & compliance',
    icon: 'business-outline',
    iconToken: 'company',
    kind: 'group',
    children: [
      {
        id: 'companies',
        title: 'Companies',
        icon: 'business-outline',
        target: { tab: 'CompanyTab', screen: 'CompanyList' },
      },
      {
        id: 'individuals',
        title: 'Individuals',
        icon: 'person-outline',
        target: { tab: 'CompanyTab', screen: 'IndividualList' },
      },
      {
        id: 'officials',
        title: 'Officials',
        icon: 'id-card-outline',
        target: { tab: 'CompanyTab', screen: 'OfficialsDetail', params: { name: 'Officials' } },
      },
      {
        id: 'charges',
        title: 'Charges',
        icon: 'receipt-outline',
        target: { tab: 'CompanyTab', screen: 'ChargesList' },
      },
      {
        id: 'form-builder',
        title: 'Form Builder',
        icon: 'construct-outline',
        target: {
          tab: 'CompanyTab',
          screen: 'ModulePlaceholder',
          params: {
            title: 'Form Builder',
            description:
              'Form templates and pop-up field management are available on web. Full mobile builder screens are next.',
          },
        },
      },
      {
        id: 'compliance',
        title: 'Compliance',
        icon: 'shield-checkmark-outline',
        target: {
          tab: 'CompanyTab',
          screen: 'ModulePlaceholder',
          params: {
            title: 'Compliance',
            description:
              'Compliance events, reminders and due-date tracker are available on web. Mobile event flows are next.',
          },
        },
      },
    ],
  },
  {
    id: 'users',
    title: 'User Management',
    subtitle: 'Accounts & access roles',
    icon: 'people-outline',
    iconToken: 'user',
    kind: 'group',
    children: [
      {
        id: 'user-list',
        title: 'Users',
        icon: 'person-outline',
        target: { tab: 'UsersTab', screen: 'UserList' },
      },
      {
        id: 'user-groups',
        title: 'User Groups',
        icon: 'people-outline',
        target: { tab: 'UsersTab', screen: 'UserGroupList' },
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    subtitle: 'System preferences',
    icon: 'settings-outline',
    iconToken: 'info',
    kind: 'link',
    target: { tab: 'SettingsTab', screen: 'SettingsHome' },
  },
  {
    id: 'profile',
    title: 'My Profile',
    subtitle: 'Account & preferences',
    icon: 'person-circle-outline',
    iconToken: 'purple',
    kind: 'link',
    target: { tab: 'SettingsTab', screen: 'UserSettings', params: { tab: 'profile' } },
  },
];

export function AppDrawerContent(props: DrawerContentComponentProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const logout = useLogout();
  const profile = useAppSelector((state) => state.user.profile);
  const initials = getProfileInitials(profile);
  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.email ||
    'ASR User';

  const [expandedIds, setExpandedIds] = useState<string[]>(['entities']);

  const toggleGroup = (id: string) => {
    setExpandedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const closeAndNavigate = (target: DrawerNavTarget) => {
    props.navigation.closeDrawer();
    if (target.screen) {
      props.navigation.navigate('MainTabs', {
        screen: target.tab,
        params: { screen: target.screen, params: target.params },
      });
      return;
    }
    props.navigation.navigate('MainTabs', { screen: target.tab });
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          props.navigation.closeDrawer();
          void logout();
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.card }]}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.brand}>
          <Image source={logoDark} style={styles.logo} resizeMode="contain" />
          <Text style={[textStyles.description, { color: theme.colors.textMuted }]}>
            ASR CSS Management System
          </Text>
        </View>

        <View
          style={[
            styles.profileCard,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileText}>
            <Text
              style={[textStyles.cardTitle, styles.profileName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            {profile?.email ? (
              <Text style={[textStyles.description, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {profile.email}
              </Text>
            ) : null}
          </View>
        </View>

        <Text style={[textStyles.sectionLabel, styles.sectionLabel, { color: theme.colors.textMuted }]}>
          Menu
        </Text>

        <View style={styles.menuList}>
          {DRAWER_MENU.map((item) => {
            if (item.kind === 'link') {
              return (
                <Pressable
                  key={item.id}
                  onPress={() => closeAndNavigate(item.target)}
                  style={({ pressed }) => [
                    styles.menuRow,
                    { backgroundColor: pressed ? theme.colors.background : 'transparent' },
                  ]}
                >
                  <IconCircle name={item.icon} token={item.iconToken} size={40} />
                  <View style={styles.menuText}>
                    <Text style={[textStyles.cardTitle, { color: theme.colors.text }]}>{item.title}</Text>
                    {item.subtitle ? (
                      <Text style={[textStyles.description, { color: theme.colors.textMuted }]} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
                </Pressable>
              );
            }

            const isExpanded = expandedIds.includes(item.id);

            return (
              <View key={item.id} style={styles.groupWrap}>
                <Pressable
                  onPress={() => toggleGroup(item.id)}
                  style={({ pressed }) => [
                    styles.menuRow,
                    {
                      backgroundColor: pressed || isExpanded ? theme.colors.background : 'transparent',
                    },
                  ]}
                >
                  <IconCircle name={item.icon} token={item.iconToken} size={40} />
                  <View style={styles.menuText}>
                    <Text style={[textStyles.cardTitle, { color: theme.colors.text }]}>{item.title}</Text>
                    {item.subtitle ? (
                      <Text style={[textStyles.description, { color: theme.colors.textMuted }]} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={theme.colors.textMuted}
                  />
                </Pressable>

                {isExpanded ? (
                  <View style={styles.submenu}>
                    <View style={[styles.submenuRail, { backgroundColor: theme.colors.border }]} />
                    <View style={styles.submenuList}>
                      {item.children.map((child) => (
                        <Pressable
                          key={child.id}
                          onPress={() => closeAndNavigate(child.target)}
                          style={({ pressed }) => [
                            styles.submenuRow,
                            { backgroundColor: pressed ? theme.colors.background : 'transparent' },
                          ]}
                        >
                          <View style={[styles.submenuDot, { backgroundColor: theme.colors.primary }]} />
                          <Text
                            style={[textStyles.body, styles.submenuTitle, { color: theme.colors.text }]}
                            numberOfLines={1}
                          >
                            {child.title}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </DrawerContentScrollView>

      <View
        style={[
          styles.footer,
          {
            borderTopColor: theme.colors.border,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutRow,
            { backgroundColor: pressed ? 'rgba(240,101,72,0.08)' : 'transparent' },
          ]}
        >
          <IconCircle name="log-out-outline" token="danger" size={40} />
          <View style={styles.menuText}>
            <Text style={[textStyles.cardTitle, { color: theme.colors.danger }]}>Log Out</Text>
            <Text style={[textStyles.description, { color: theme.colors.textMuted }]}>
              Sign out from this device
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: designSystem.screenPadding,
    paddingBottom: 12,
  },
  brand: {
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 18,
    paddingHorizontal: 2,
  },
  logo: {
    width: 128,
    height: 32,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: designSystem.cardRadius,
    padding: 12,
    marginBottom: 20,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: fontWeight.bold,
  },
  profileText: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontWeight: fontWeight.semibold,
  },
  sectionLabel: {
    marginBottom: 8,
    marginLeft: 2,
  },
  menuList: {
    gap: 4,
  },
  groupWrap: {
    gap: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  menuText: {
    flex: 1,
    gap: 1,
  },
  submenu: {
    flexDirection: 'row',
    marginLeft: 28,
    marginBottom: 6,
    minHeight: 8,
  },
  submenuRail: {
    width: 2,
    borderRadius: 2,
    marginVertical: 4,
  },
  submenuList: {
    flex: 1,
    paddingLeft: 14,
    gap: 2,
  },
  submenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  submenuDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  submenuTitle: {
    flex: 1,
    fontWeight: fontWeight.medium,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: designSystem.screenPadding,
    paddingTop: 8,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
});
