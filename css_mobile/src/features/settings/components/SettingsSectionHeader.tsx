import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';

type SettingsSectionHeaderProps = {
  title: string;
  subtitle?: string;
};

export function SettingsSectionHeader({ title, subtitle }: SettingsSectionHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <View style={[styles.accent, { backgroundColor: theme.colors.primary }]} />
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      </View>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    marginTop: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accent: {
    width: 4,
    height: 16,
    borderRadius: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    marginLeft: 12,
  },
});
