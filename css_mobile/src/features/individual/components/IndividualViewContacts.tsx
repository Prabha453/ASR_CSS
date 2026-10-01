import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { useTheme } from '@/shared/theme/ThemeContext';
import { Individual, IndividualContact } from '../types/individual.types';
import { formatContactValue } from '../utils/individual.utils';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const CONTACT_ICONS: Record<string, IoniconsName> = {
  EMAIL: 'mail-outline',
  MOBILE: 'phone-portrait-outline',
  OFFICE: 'call-outline',
  FAX: 'print-outline',
  HOME: 'home-outline',
  OTHER: 'globe-outline',
};

type IndividualViewContactsProps = {
  individual: Individual;
};

export function IndividualViewContacts({ individual }: IndividualViewContactsProps) {
  const { theme } = useTheme();
  const contacts = individual.contacts ?? [];
  const skype = individual.individual_detail?.skype_id;

  if (contacts.length === 0 && !skype) {
    return (
      <View
        style={[
          styles.emptyCard,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        ]}
      >
        <Ionicons name="call-outline" size={22} color={theme.colors.textMuted} />
        <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
          No contact details recorded.
        </Text>
      </View>
    );
  }

  const renderContact = (item: IndividualContact, index: number) => (
    <View
      key={item.contact_id ?? `${item.contact_type}-${index}`}
      style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
    >
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={CONTACT_ICONS[item.contact_type ?? ''] ?? 'call-outline'}
            size={18}
            color="#405189"
          />
        </View>
        <View style={styles.content}>
          <Text style={[styles.type, { color: theme.colors.textMuted }]}>
            {(item.contact_type ?? 'Contact').replace(/_/g, ' ')}
          </Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            {formatContactValue(item)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.wrap}>
      {contacts.map(renderContact)}
      {skype ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <View style={styles.left}>
            <View style={styles.iconWrap}>
              <Ionicons name="logo-skype" size={18} color="#405189" />
            </View>
            <View style={styles.content}>
              <Text style={[styles.type, { color: theme.colors.textMuted }]}>Skype</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>{skype}</Text>
            </View>
          </View>
        </View>
      ) : null}
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
