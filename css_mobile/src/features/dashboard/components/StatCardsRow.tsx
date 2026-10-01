import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { DASHBOARD_STATS } from '../constants/dashboard.constants';

export function StatCardsRow() {
  const { theme } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {DASHBOARD_STATS.map((stat) => (
        <View
          key={stat.id}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={[styles.iconBox, { backgroundColor: `${stat.color}1a` }]}>
            <Ionicons name={stat.icon} size={18} color={stat.color} />
          </View>
          <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={1}>
            {stat.value}
          </Text>
          <Text style={[styles.label, { color: theme.colors.textMuted }]} numberOfLines={1}>
            {stat.label}
          </Text>
          <View style={styles.changeRow}>
            <Ionicons name="arrow-up" size={11} color={theme.colors.success} />
            <Text style={[styles.change, { color: theme.colors.success }]} numberOfLines={1}>
              {stat.change}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginHorizontal: -16,
    overflow: 'visible',
  },
  content: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 2,
  },
  card: {
    width: 150,
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#212529',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 19,
    fontWeight: '800',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 8,
  },
  change: {
    fontSize: 10,
    fontWeight: '700',
    flexShrink: 1,
  },
});
