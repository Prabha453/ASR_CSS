import { StyleSheet, Text, View } from 'react-native';
import { USER_STATUS_META } from '../constants/user.constants';
import { UserStatus } from '../types/user.types';

type UserStatusBadgeProps = {
  status?: UserStatus;
};

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const meta = USER_STATUS_META[status ?? 'PENDING'] ?? {
    label: status ?? 'Unknown',
    color: '#878a99',
    bg: 'rgba(135,138,153,0.12)',
  };

  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <Text style={[styles.text, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
