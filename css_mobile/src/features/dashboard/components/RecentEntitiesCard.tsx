import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { RECENT_ENTITIES } from '../constants/dashboard.constants';
import { DashboardCard } from './DashboardCard';

type RecentEntitiesCardProps = {
  onViewAll?: () => void;
};

export function RecentEntitiesCard({ onViewAll }: RecentEntitiesCardProps) {
  const { theme } = useTheme();

  return (
    <DashboardCard title="Recent Entities" onAction={onViewAll}>
      <View style={styles.list}>
        {RECENT_ENTITIES.map((entity) => (
          <View key={entity.id} style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: `${entity.color}1a` }]}>
              <Ionicons name={entity.icon} size={18} color={entity.color} />
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
                {entity.name}
              </Text>
              <Text style={[styles.meta, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {entity.type} • {entity.date}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: `${theme.colors.success}18` }]}>
              <Text style={[styles.badgeText, { color: theme.colors.success }]}>Active</Text>
            </View>
          </View>
        ))}
      </View>
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
