import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EnterpriseCard } from '@/shared/components/common/EnterpriseCard';
import { designSystem, textStyles } from '@/shared/theme/designSystem';
import { fontSize } from '@/shared/theme/typography';
import { useTheme } from '@/shared/theme/ThemeContext';

type SettingsInfoSectionProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function SettingsInfoSection({ title, subtitle, children }: SettingsInfoSectionProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.wrap}>
      <EnterpriseCard padded style={styles.card}>
        <View style={styles.header}>
          <View style={[styles.accent, { backgroundColor: theme.colors.primary }]} />
          <View style={styles.headerText}>
            <Text style={[textStyles.sectionTitle, styles.title, { color: theme.colors.text }]}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.content}>{children}</View>
      </EnterpriseCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: designSystem.cardGap,
  },
  card: {
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 4,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(135, 138, 153, 0.2)',
  },
  accent: {
    width: 4,
    height: 18,
    borderRadius: 4,
    marginTop: 2,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: fontSize.bodyLg,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: fontSize.label,
    lineHeight: 17,
  },
  content: {
    paddingTop: 2,
  },
});
