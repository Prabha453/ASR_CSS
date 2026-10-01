import { StyleSheet, Text, View } from 'react-native';
import { COMPANY_STATUS_META } from '../constants/company.constants';
import { CompanyStatus } from '../types/company.types';

type CompanyStatusBadgeProps = {
  status?: CompanyStatus;
};

export function CompanyStatusBadge({ status }: CompanyStatusBadgeProps) {
  const meta = COMPANY_STATUS_META[status ?? ''] ?? {
    label: status ?? 'Unknown',
    color: '#878a99',
    bg: 'rgba(135,138,153,0.12)',
  };

  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <Text style={[styles.text, { color: meta.color }]} numberOfLines={1}>
        {meta.label}
      </Text>
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
    flexShrink: 0,
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

