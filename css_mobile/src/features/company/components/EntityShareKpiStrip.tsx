import { StyleSheet, Text, View } from 'react-native';
import { EntityShare } from '../types/entityShare.types';
import { EffectiveDecimals, formatShareNumber } from '../utils/entityShare.utils';

type EntityShareKpiStripProps = {
  shares: EntityShare[];
  decimals: EffectiveDecimals;
};

const KPI_ITEMS = [
  { key: 'shares', label: 'Total Shares', color: '#405189', field: 'number_of_shares' as const, dec: 'shares' as const },
  { key: 'auth', label: 'Authorized', color: '#6559cc', field: 'authorized_share_capital' as const, dec: 'paid' as const },
  { key: 'issued', label: 'Issued', color: '#299cdb', field: 'issued_share_capital' as const, dec: 'issued' as const },
  { key: 'paid', label: 'Paid-up', color: '#0ab39c', field: 'paid_up_capital' as const, dec: 'paid' as const },
];

export function EntityShareKpiStrip({ shares, decimals }: EntityShareKpiStripProps) {
  return (
    <View style={styles.wrap}>
      {KPI_ITEMS.map((item) => {
        const total = shares.reduce((sum, share) => sum + (Number(share[item.field]) || 0), 0);
        return (
          <View key={item.key} style={[styles.card, { backgroundColor: `${item.color}12` }]}>
            <Text style={[styles.value, { color: item.color }]}>
              {formatShareNumber(total, decimals[item.dec])}
            </Text>
            <Text style={[styles.label, { color: item.color }]}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
