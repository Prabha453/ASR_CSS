import { StyleSheet, Text, View } from 'react-native';
import { ReactNode } from 'react';
import { fontSize } from '@/shared/theme/typography';
import { useTheme } from '@/shared/theme/ThemeContext';

type SettingsInfoRowProps = {
  label: string;
  value?: string;
  children?: ReactNode;
  showDivider?: boolean;
  multiline?: boolean;
};

function displayValue(value?: string) {
  return value?.trim() ? value : '—';
}

export function SettingsInfoRow({
  label,
  value,
  children,
  showDivider = true,
  multiline = false,
}: SettingsInfoRowProps) {
  const { theme } = useTheme();

  if (multiline) {
    return (
      <View
        style={[
          styles.multilineRow,
          showDivider ? { borderBottomColor: theme.colors.border, borderBottomWidth: StyleSheet.hairlineWidth } : null,
        ]}
      >
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
        {children ?? (
          <Text style={[styles.multilineValue, { color: theme.colors.text }]}>{displayValue(value)}</Text>
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.row,
        showDivider ? { borderBottomColor: theme.colors.border, borderBottomWidth: StyleSheet.hairlineWidth } : null,
      ]}
    >
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      {children ?? (
        <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={3}>
          {displayValue(value)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 11,
  },
  multilineRow: {
    gap: 6,
    paddingVertical: 11,
  },
  label: {
    fontSize: fontSize.small,
    lineHeight: 18,
    flexShrink: 0,
    maxWidth: '42%',
  },
  value: {
    fontSize: fontSize.small,
    fontWeight: '600',
    lineHeight: 18,
    flex: 1,
    textAlign: 'right',
  },
  multilineValue: {
    fontSize: fontSize.small,
    fontWeight: '600',
    lineHeight: 19,
  },
});
