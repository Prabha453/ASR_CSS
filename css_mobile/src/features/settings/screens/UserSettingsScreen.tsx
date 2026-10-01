import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '@/app/navigation/types';
import { useAppSelector } from '@/app/store/hooks';
import {
  SettingsDetailLayout,
  SettingsGroupRow,
  SettingsGroupSection,
  SettingsPageSummary,
  SettingsInfoRow,
  SettingsInfoSection,
} from '../components';
import { getProfileInitials } from '../utils/settings.utils';
import { textStyles } from '@/shared/theme/designSystem';

type Props = NativeStackScreenProps<SettingsStackParamList, 'UserSettings'>;

export function UserSettingsScreen({ navigation }: Props) {
  const profile = useAppSelector((state) => state.user.profile);
  const fullName = `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'User';

  return (
    <SettingsDetailLayout
      title="User Profile"
      onBack={() => navigation.goBack()}
      hero={
        <SettingsPageSummary
          icon="person-outline"
          iconToken="user"
          title={fullName}
          subtitle={profile?.user_role ?? 'User'}
          badge="Active"
          chips={[{ label: 'Email', value: profile?.email ?? '—' }]}
        />
      }
    >
      <SettingsInfoSection title="Profile Information" subtitle="Account details">
        <SettingsInfoRow label="Full Name" value={fullName} />
        <SettingsInfoRow label="Email" value={profile?.email} />
        <SettingsInfoRow label="Role" value={profile?.user_role} showDivider={false} />
      </SettingsInfoSection>

      <SettingsGroupSection title="Preferences">
        <SettingsGroupRow
          title="App Preferences"
          description="Layout, theme and display settings"
          icon="settings-outline"
          iconToken="disabled"
          showDivider
          onPress={() => navigation.navigate('AppPreferences')}
        />
        <SettingsGroupRow
          title="Change Password"
          description="Update account password"
          icon="lock-closed-outline"
          iconToken="security"
          showDivider={false}
          onPress={() => navigation.navigate('ChangePassword')}
        />
      </SettingsGroupSection>

      <Text style={[textStyles.description, styles.note]}>
        Designation master and advanced user settings are available on the web settings module.
      </Text>
    </SettingsDetailLayout>
  );
}

const styles = StyleSheet.create({
  note: {
    lineHeight: 18,
    marginTop: 4,
  },
});
