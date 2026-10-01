import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { INDIVIDUAL_ADDRESS_LABELS } from '../constants/individual.constants';
import { IndividualAddress } from '../types/individual.types';
import { formatAddressLines } from '../utils/individual.utils';

type IndividualViewAddressesProps = {
  addresses?: IndividualAddress[];
};

export function IndividualViewAddresses({ addresses = [] }: IndividualViewAddressesProps) {
  const { theme } = useTheme();

  if (addresses.length === 0) {
    return (
      <View
        style={[
          styles.emptyCard,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        ]}
      >
        <Ionicons name="location-outline" size={22} color={theme.colors.textMuted} />
        <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
          No addresses recorded.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {addresses.map((item) => {
        const lines = formatAddressLines(item);
        const typeLabel =
          INDIVIDUAL_ADDRESS_LABELS[item.address_type ?? ''] ||
          item.address_type?.replace(/_/g, ' ') ||
          'Address';
        return (
          <View
            key={item.address_id ?? `${item.address_type}-${item.postal_code}`}
            style={[
              styles.card,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.header}>
              <Ionicons name="location-outline" size={16} color="#405189" />
              <Text style={[styles.type, { color: theme.colors.text }]}>{typeLabel}</Text>
            </View>
            {lines ? (
              <Text style={[styles.line, { color: theme.colors.textMuted }]}>{lines}</Text>
            ) : (
              <Text style={[styles.line, { color: theme.colors.textMuted }]}>—</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  type: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  line: {
    fontSize: 13,
    lineHeight: 20,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
