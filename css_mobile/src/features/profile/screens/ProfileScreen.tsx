import { StyleSheet, Text, View } from 'react-native';
import { PrimaryScreenShell } from '@/shared/components/layout';
import { EnterpriseCard } from '@/shared/components/common/EnterpriseCard';
import { useAppSelector } from '@/app/store/hooks';
import { textStyles } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';

export function ProfileScreen() {
  const { theme } = useTheme();
  const profile = useAppSelector((state) => state.user.profile);
  const portNumber = useAppSelector((state) => state.auth.portNumber);

  return (
    <PrimaryScreenShell title="Profile">
      <Text style={[textStyles.description, styles.subtitle, { color: theme.colors.textMuted }]}>
        Account details
      </Text>
      <EnterpriseCard padded>
        <Text style={[textStyles.description, { color: theme.colors.textMuted }]}>Name</Text>
        <Text style={[textStyles.cardTitle, styles.value, { color: theme.colors.text }]}>
          {[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—'}
        </Text>
        <Text style={[textStyles.description, styles.label, { color: theme.colors.textMuted }]}>Email</Text>
        <Text style={[textStyles.cardTitle, styles.value, { color: theme.colors.text }]}>
          {profile?.email ?? '—'}
        </Text>
        <Text style={[textStyles.description, styles.label, { color: theme.colors.textMuted }]}>Role</Text>
        <Text style={[textStyles.cardTitle, styles.value, { color: theme.colors.text }]}>
          {profile?.user_role ?? '—'}
        </Text>
        <Text style={[textStyles.description, styles.label, { color: theme.colors.textMuted }]}>Port Number</Text>
        <Text style={[textStyles.cardTitle, styles.value, { color: theme.colors.text }]}>
          {portNumber ?? '—'}
        </Text>
      </EnterpriseCard>
    </PrimaryScreenShell>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginBottom: 16,
  },
  label: {
    marginTop: 12,
  },
  value: {
    marginTop: 4,
    fontWeight: '600',
  },
});
