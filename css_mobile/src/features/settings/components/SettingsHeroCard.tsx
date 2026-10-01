import { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { IconCircle } from '@/shared/components/common/IconCircle';
import { EnterpriseCard } from '@/shared/components/common/EnterpriseCard';
import { IconTokenKey } from '@/shared/theme/iconTokens';
import { designSystem, textStyles } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';
import { SettingsIconName } from '../types/settings.types';

type SettingsHeroCardProps = {
  icon: SettingsIconName;
  iconToken?: IconTokenKey;
  title: string;
  subtitle?: string;
  badge?: string;
  meta?: { label: string; value: string }[];
  footer?: ReactNode;
  variant?: 'default' | 'gradient' | 'success';
  style?: ViewStyle;
};

export function SettingsHeroCard({
  icon,
  iconToken = 'primary',
  title,
  subtitle,
  badge,
  meta,
  footer,
  variant = 'default',
  style,
}: SettingsHeroCardProps) {
  const { theme } = useTheme();

  const badgeNode = badge ? (
    <View style={[styles.badge, { backgroundColor: `${theme.colors.success}18` }]}>
      <View style={[styles.badgeDot, { backgroundColor: theme.colors.success }]} />
      <Text style={[styles.badgeText, { color: theme.colors.success }]}>{badge}</Text>
    </View>
  ) : null;

  if (variant === 'gradient') {
    return (
      <LinearGradient colors={[...theme.colors.primaryGradient]} style={[styles.gradientCard, style]}>
        <View style={styles.topRow}>
          <View style={styles.gradientIconWrap}>
            <Ionicons name={icon} size={22} color="#405189" />
          </View>
          {badge ? (
            <View style={styles.gradientBadge}>
              <View style={[styles.badgeDot, { backgroundColor: theme.colors.success }]} />
              <Text style={[styles.badgeText, { color: theme.colors.success }]}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.gradientTitle}>{title}</Text>
        {subtitle ? <Text style={styles.gradientSubtitle}>{subtitle}</Text> : null}
        {meta?.length ? (
          <View style={styles.metaRow}>
            {meta.map((item) => (
              <View key={item.label} style={styles.metaItem}>
                <Text style={styles.gradientMetaLabel}>{item.label}</Text>
                <Text style={styles.gradientMetaValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {footer}
      </LinearGradient>
    );
  }

  if (variant === 'success') {
    return (
      <View style={[styles.successCard, style]}>
        <View style={styles.topRow}>
          <View style={styles.successIconWrap}>
            <Ionicons name={icon} size={22} color="#ffffff" />
          </View>
        </View>
        <Text style={styles.successTitle}>{title}</Text>
        {subtitle ? <Text style={styles.successSubtitle}>{subtitle}</Text> : null}
        {meta?.length ? (
          <View style={styles.metaRow}>
            {meta.map((item) => (
              <View key={item.label} style={styles.metaItem}>
                <Text style={styles.successMetaLabel}>{item.label}</Text>
                <Text style={styles.successMetaValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {footer}
      </View>
    );
  }

  return (
    <EnterpriseCard style={StyleSheet.flatten([styles.card, style])} padded>
      <View style={styles.topRow}>
        <IconCircle name={icon} token={iconToken} />
        {badgeNode}
      </View>

      <Text style={[textStyles.sectionTitle, styles.title, { color: theme.colors.text }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[textStyles.description, { color: theme.colors.textMuted }]}>{subtitle}</Text>
      ) : null}

      {meta?.length ? (
        <View style={styles.metaRow}>
          {meta.map((item) => (
            <View key={item.label} style={styles.metaItem}>
              <Text style={[textStyles.description, { color: theme.colors.textMuted }]}>
                {item.label}
              </Text>
              <Text style={[textStyles.cardTitle, { color: theme.colors.text, fontWeight: '700' }]}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {footer}
    </EnterpriseCard>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
  },
  gradientCard: {
    borderRadius: designSystem.cardRadius,
    padding: designSystem.screenPadding,
  },
  successCard: {
    borderRadius: designSystem.cardRadius,
    padding: designSystem.screenPadding,
    backgroundColor: '#0ab39c',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: designSystem.cardGap,
  },
  gradientIconWrap: {
    width: designSystem.iconCircleSize,
    height: designSystem.iconCircleSize,
    borderRadius: designSystem.iconCircleRadius,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconWrap: {
    width: designSystem.iconCircleSize,
    height: designSystem.iconCircleSize,
    borderRadius: designSystem.iconCircleRadius,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  gradientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  title: {
    marginBottom: 4,
  },
  gradientTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  gradientSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
  successTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  successSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: designSystem.cardGap,
  },
  metaItem: {
    gap: 2,
  },
  gradientMetaLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
  },
  gradientMetaValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  successMetaLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
  },
  successMetaValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
