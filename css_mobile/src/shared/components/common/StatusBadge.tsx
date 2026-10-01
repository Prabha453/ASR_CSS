import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';

export type StatusType = 'active' | 'inactive' | 'pending' | 'danger' | 'default';

type StatusBadgeProps = {
  label: string;
  type?: StatusType;
};

const typeStyles: Record<StatusType, { background: string; color: string }> = {
  active: { background: '#EAFBF7', color: '#0ab39c' },
  inactive: { background: '#F4F4F4', color: '#878a99' },
  pending: { background: '#FFF4E8', color: '#f7b84b' },
  danger: { background: '#FFE8E5', color: '#f06548' },
  default: { background: '#EEF4FF', color: '#405189' },
};

export function StatusBadge({ label, type = 'default' }: StatusBadgeProps) {
  const palette = typeStyles[type];

  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <Text style={[styles.text, { color: palette.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
