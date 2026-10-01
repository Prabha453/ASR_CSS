import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { Individual } from '../types/individual.types';

type IndividualViewRelationshipsProps = {
  individual: Individual;
};

export function IndividualViewRelationships({ individual }: IndividualViewRelationshipsProps) {
  const { theme } = useTheme();
  const detail = individual.individual_detail;
  const relationships = individual.relationships ?? [];
  const familyRows = [
    { label: 'Father', value: detail?.father_name },
    { label: 'Mother', value: detail?.mother_name },
    { label: 'Spouse', value: detail?.spouse_name },
  ].filter((row) => row.value?.trim());

  if (familyRows.length === 0 && relationships.length === 0) {
    return (
      <View
        style={[
          styles.emptyCard,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        ]}
      >
        <Ionicons name="people-outline" size={22} color={theme.colors.textMuted} />
        <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
          No family relationships recorded.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {familyRows.map((row) => (
        <View
          key={row.label}
          style={[
            styles.card,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <View style={styles.left}>
            <View style={styles.iconWrap}>
              <Ionicons name="person-outline" size={18} color="#405189" />
            </View>
            <View style={styles.content}>
              <Text style={[styles.type, { color: theme.colors.textMuted }]}>{row.label}</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>{row.value}</Text>
            </View>
          </View>
        </View>
      ))}

      {relationships.map((row, index) => (
        <View
          key={row.relationship_id ?? `${row.relationship_type}-${index}`}
          style={[
            styles.card,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <View style={styles.left}>
            <View style={styles.iconWrap}>
              <Ionicons name="people-outline" size={18} color="#405189" />
            </View>
            <View style={styles.content}>
              <Text style={[styles.type, { color: theme.colors.textMuted }]}>
                {(row.relationship_type ?? 'Related').replace(/_/g, ' ')}
              </Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>
                {row.related_name || '—'}
              </Text>
            </View>
          </View>
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
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(64,81,137,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  type: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
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
