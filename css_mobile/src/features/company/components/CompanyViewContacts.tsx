import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { useTheme } from '@/shared/theme/ThemeContext';
import { CompanyContact } from '../types/company.types';
import {
  formatContactValue,
  getContactIcon,
  getContactTypeLabel,
  isTruthyFlag,
} from '../utils/company.utils';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

type CompanyViewContactsProps = {
  contacts?: CompanyContact[];
};

export function CompanyViewContacts({ contacts = [] }: CompanyViewContactsProps) {
  const { theme } = useTheme();

  if (contacts.length === 0) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Ionicons name="call-outline" size={22} color={theme.colors.textMuted} />
        <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>No contact details recorded.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {contacts.map((item) => (
        <View
          key={`${item.contact_id ?? item.contact_type}-${item.contact_value ?? ''}`}
          style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        >
          <View style={styles.left}>
            <View style={styles.iconWrap}>
              <Ionicons name={getContactIcon(item.contact_type) as IoniconsName} size={18} color="#405189" />
            </View>
            <View style={styles.content}>
              <View style={styles.titleRow}>
                <Text style={[styles.type, { color: theme.colors.textMuted }]}>
                  {getContactTypeLabel(item.contact_type)}
                </Text>
                {isTruthyFlag(item.is_primary) ? (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryText}>Primary</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.value, { color: theme.colors.text }]}>{formatContactValue(item)}</Text>
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
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  type: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  primaryBadge: {
    backgroundColor: 'rgba(10,179,156,0.12)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  primaryText: {
    color: '#0ab39c',
    fontSize: 10,
    fontWeight: '700',
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
