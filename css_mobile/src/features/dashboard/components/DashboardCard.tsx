import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';

type DashboardCardProps = {
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
  style?: ViewStyle;
};

export function DashboardCard({ title, actionLabel = 'View All', onAction, children, style }: DashboardCardProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card }, style]}>
      {title ? (
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {onAction ? (
            <Pressable onPress={onAction} hitSlop={8}>
              <Text style={[styles.action, { color: theme.colors.secondary }]}>{actionLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    shadowColor: '#212529',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  action: {
    fontSize: 12,
    fontWeight: '700',
  },
});
