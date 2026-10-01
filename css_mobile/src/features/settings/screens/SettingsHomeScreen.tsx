import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppSelector } from '@/app/store/hooks';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { SettingsStackParamList } from '@/app/navigation/types';
import { AppHeader, ScreenShell } from '@/shared/components/layout';
import { useToast } from '@/shared/components/common/ToastProvider';
import { designSystem, textStyles } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';
import { getMasterResource } from '../constants/masterData.constants';
import { SettingsGroupRow, SettingsGroupSection } from '../components';
import { SETTINGS_MENU_GROUPS, SettingsMenuGroupItem } from '../constants/settings.constants';
import { useSettingsOverview } from '../hooks/useSettingsOverview';
import { getProfileInitials } from '../utils/settings.utils';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsHome'>;

export function SettingsHomeScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const logout = useLogout();
  const profile = useAppSelector((state) => state.user.profile);
  const { isLoading, isError, refetch, isRefetching } = useSettingsOverview();

  const initials = getProfileInitials(profile);

  const handleNavigate = (item: SettingsMenuGroupItem) => {
    if (item.comingSoon) {
      showToast('This module will be available in a future update.', { type: 'info' });
      return;
    }

    if (item.route === 'MasterDataList' && item.masterResourceId) {
      const resource = getMasterResource(item.masterResourceId);
      navigation.navigate('MasterDataList', {
        resourceId: item.masterResourceId,
        title: resource?.title ?? item.title,
      });
      return;
    }

    switch (item.route) {
      case 'CompanyProfile': {
        const tab =
          item.initialTab === 'decimal' ||
          item.initialTab === 'contact' ||
          item.initialTab === 'email'
            ? item.initialTab
            : 'company';
        navigation.navigate('CompanyProfile', { tab });
        break;
      }
      case 'SharesSettings': {
        const tab =
          item.initialTab === 'transfer' || item.initialTab === 'authorized-capital'
            ? item.initialTab
            : 'certificate';
        navigation.navigate('SharesSettings', { tab });
        break;
      }
      case 'UserSettings':
        navigation.navigate('UserSettings', { tab: 'profile' });
        break;
      case 'ChangePassword':
        navigation.navigate('ChangePassword');
        break;
      case 'MasterSettings':
        navigation.navigate('MasterSettings');
        break;
      case 'AppPreferences':
        navigation.navigate('AppPreferences');
        break;
      default:
        break;
    }
  };

  return (
    <ScreenShell
      contentStyle={styles.content}
      header={
        <AppHeader
          title="Settings"
          leftAction="menu"
          showNotifications
          notificationCount={3}
          showProfile
          profileInitials={initials}
        />
      }
    >
      <Text style={[textStyles.description, styles.subtitle, { color: theme.colors.textMuted }]}>
        Manage system settings and preferences
      </Text>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[textStyles.description, { color: theme.colors.textMuted }]}>
            Loading settings...
          </Text>
        </View>
      ) : null}

      {isError ? (
        <Pressable style={styles.errorCard} onPress={() => void refetch()}>
          <Text style={[textStyles.description, { color: theme.colors.danger }]}>
            Could not load settings data. Tap to retry.
          </Text>
        </Pressable>
      ) : null}

      {SETTINGS_MENU_GROUPS.map((group) => (
        <SettingsGroupSection key={group.id} title={group.title}>
          {group.items.map((item, index) => (
            <SettingsGroupRow
              key={item.id}
              title={item.title}
              description={item.description}
              icon={item.icon}
              iconToken={item.iconToken}
              showDivider={index < group.items.length - 1}
              onPress={() => handleNavigate(item)}
            />
          ))}
        </SettingsGroupSection>
      ))}

      <SettingsGroupSection title="SESSION">
        <SettingsGroupRow
          title="Log Out"
          description="Sign out from this device"
          icon="log-out-outline"
          iconToken="danger"
          showDivider={false}
          onPress={() => void logout()}
        />
      </SettingsGroupSection>

      {isRefetching ? (
        <Text style={[textStyles.description, styles.syncText, { color: theme.colors.textMuted }]}>
          Syncing settings...
        </Text>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: designSystem.screenPadding,
  },
  subtitle: {
    marginBottom: designSystem.sectionGap,
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: designSystem.cardGap,
  },
  errorCard: {
    marginBottom: designSystem.cardGap,
  },
  syncText: {
    textAlign: 'center',
    marginTop: 8,
  },
});
