import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '@/shared/components/common/PrimaryButton';
import { useTheme } from '@/shared/theme/ThemeContext';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
};

export function EmptyState({
  title,
  description,
  icon = 'folder-open-outline',
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.primary}12` }]}>
        <Ionicons name={icon} size={32} color={theme.colors.primary} />
      </View>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 280,
  },
  action: {
    marginTop: 18,
  },
});
