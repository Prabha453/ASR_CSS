import { StyleSheet, Switch, Text, View, ViewStyle } from 'react-native';
import { fontSize } from '@/shared/theme/typography';
import { useTheme } from '@/shared/theme/ThemeContext';

const TRACK_ON = '#34C759';
const TRACK_OFF = '#E4E6EB';

type SettingsSwitchRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  showDivider?: boolean;
  style?: ViewStyle;
};

export function SettingsSwitchRow({
  label,
  description,
  value,
  onValueChange,
  disabled,
  showDivider = true,
  style,
}: SettingsSwitchRowProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.row,
        showDivider
          ? { borderBottomColor: theme.colors.border, borderBottomWidth: StyleSheet.hairlineWidth }
          : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <View style={styles.textWrap}>
        <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
        {description ? (
          <Text style={[styles.description, { color: theme.colors.textMuted }]}>{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: TRACK_OFF, true: TRACK_ON }}
        thumbColor="#ffffff"
        ios_backgroundColor={TRACK_OFF}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: '500',
  },
  description: {
    fontSize: fontSize.label,
  },
});
