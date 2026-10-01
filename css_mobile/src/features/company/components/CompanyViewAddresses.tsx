import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { CompanyAddress } from '../types/company.types';
import { formatAddressLines, formatCompanyDate, getAddressTypeLabel, isTruthyFlag } from '../utils/company.utils';

type CompanyViewAddressesProps = {
  addresses?: CompanyAddress[];
};

export function CompanyViewAddresses({ addresses = [] }: CompanyViewAddressesProps) {
  const { theme } = useTheme();

  if (addresses.length === 0) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Ionicons name="location-outline" size={22} color={theme.colors.textMuted} />
        <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>No addresses recorded.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {addresses.map((item) => {
        const lines = formatAddressLines(item);
        return (
          <View
            key={`${item.address_id ?? item.address_type}-${item.street_name ?? ''}`}
            style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <View style={styles.header}>
              <Ionicons name="location-outline" size={16} color="#405189" />
              <Text style={[styles.type, { color: theme.colors.text }]}>
                {getAddressTypeLabel(item.address_type)}
              </Text>
              {isTruthyFlag(item.is_primary) ? (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryText}>Default</Text>
                </View>
              ) : null}
            </View>
            {lines.map((line) => (
              <Text key={line} style={[styles.line, { color: theme.colors.textMuted }]}>
                {line}
              </Text>
            ))}
            {item.effective_from ? (
              <Text style={[styles.effective, { color: theme.colors.textMuted }]}>
                From {formatCompanyDate(item.effective_from)}
                {item.effective_to ? ` → ${formatCompanyDate(item.effective_to)}` : ''}
              </Text>
            ) : null}
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
  primaryBadge: {
    backgroundColor: 'rgba(64,81,137,0.12)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  primaryText: {
    color: '#405189',
    fontSize: 10,
    fontWeight: '700',
  },
  line: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 2,
  },
  effective: {
    fontSize: 11,
    marginTop: 6,
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
