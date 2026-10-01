import { StyleSheet, Text, View } from 'react-native';
import { IconCircle } from '@/shared/components/common/IconCircle';
import { IconTokenKey } from '@/shared/theme/iconTokens';
import { designSystem } from '@/shared/theme/designSystem';
import { fontSize } from '@/shared/theme/typography';
import { useTheme } from '@/shared/theme/ThemeContext';
import { SettingsIconName } from '../types/settings.types';

type SummaryChip = {
  label: string;
  value: string;
};

type SettingsPageSummaryProps = {
  icon: SettingsIconName;
  iconToken?: IconTokenKey;
  title: string;
  subtitle?: string;
  badge?: string;
  chips?: SummaryChip[];
};

export function SettingsPageSummary({
  icon,
  iconToken = 'primary',
  title,
  subtitle,
  badge,
  chips,
}: SettingsPageSummaryProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.colors.card,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.mainRow}>
        <IconCircle name={icon} token={iconToken} size={40} />
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: `${theme.colors.success}14` }]}>
            <View style={[styles.badgeDot, { backgroundColor: theme.colors.success }]} />
            <Text style={[styles.badgeText, { color: theme.colors.success }]}>{badge}</Text>
          </View>
        ) : null}
      </View>

      {chips?.length ? (
        <View style={styles.chipRow}>
          {chips.map((chip) => (
            <View
              key={chip.label}
              style={[styles.chip, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
            >
              <Text style={[styles.chipLabel, { color: theme.colors.textMuted }]}>{chip.label}</Text>
              <Text style={[styles.chipValue, { color: theme.colors.text }]} numberOfLines={1}>
                {chip.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: designSystem.screenPadding,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textCol: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: '700',
    lineHeight: 21,
  },
  subtitle: {
    fontSize: fontSize.small,
    lineHeight: 18,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexShrink: 0,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: fontSize.caption,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: '30%',
    flexGrow: 1,
    gap: 2,
  },
  chipLabel: {
    fontSize: fontSize.caption,
    fontWeight: '600',
  },
  chipValue: {
    fontSize: fontSize.small,
    fontWeight: '700',
  },
});
