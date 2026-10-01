import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { SETTINGS_QUICK_ACTIONS } from '../constants/settings.constants';

export function SettingsQuickActions() {
  const { theme } = useTheme();

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Quick Actions</Text>
        <Text style={[styles.link, { color: theme.colors.secondary }]}>View All</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {SETTINGS_QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.id}
            style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${action.color}18` }]}>
              <Ionicons name={action.icon} size={20} color={action.color} />
            </View>
            <Text style={[styles.label, { color: theme.colors.text }]}>{action.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  link: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    gap: 10,
    paddingRight: 4,
  },
  card: {
    width: 108,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
