import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { IndividualIdentification } from '../types/individual.types';
import { formatIndividualDate } from '../utils/individual.utils';

type IndividualViewIdsProps = {
  identifications?: IndividualIdentification[];
};

export function IndividualViewIds({ identifications = [] }: IndividualViewIdsProps) {
  const { theme } = useTheme();

  if (identifications.length === 0) {
    return (
      <View
        style={[
          styles.emptyCard,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        ]}
      >
        <Ionicons name="card-outline" size={22} color={theme.colors.textMuted} />
        <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
          No ID documents recorded.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {identifications.map((row) => (
        <View
          key={row.identification_id ?? row.id_number}
          style={[
            styles.card,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name="card-outline" size={18} color="#405189" />
            </View>
            <Text style={[styles.type, { color: theme.colors.text }]}>
              {row.member_id_type?.member_id_type_name || 'Identification'}
            </Text>
          </View>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            {row.id_number || '—'}
          </Text>
          {row.id_issued_country ? (
            <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
              Issued: {row.id_issued_country}
            </Text>
          ) : null}
          <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
            {formatIndividualDate(row.id_issued_date) || '—'}
            {' → '}
            {formatIndividualDate(row.id_expired_date) || '—'}
          </Text>
        </View>
      ))}
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
    gap: 10,
    marginBottom: 8,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(64,81,137,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  type: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
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
