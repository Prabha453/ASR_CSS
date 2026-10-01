import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/shared/components/common/PrimaryButton';
import { useTheme } from '@/shared/theme/ThemeContext';

type EntityListHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function EntityListHeader({
  title,
  subtitle,
  actionLabel,
  onActionPress,
}: EntityListHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
      {actionLabel && onActionPress ? (
        <PrimaryButton label={actionLabel} onPress={onActionPress} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
  },
});
