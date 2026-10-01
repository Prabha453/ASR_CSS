import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { QUICK_ACTIONS, QuickActionId } from '../constants/dashboard.constants';
import { DashboardCard } from './DashboardCard';

type QuickActionsCardProps = {
  onAction: (id: QuickActionId) => void;
  onViewAll?: () => void;
};

export function QuickActionsCard({ onAction, onViewAll }: QuickActionsCardProps) {
  const { theme } = useTheme();

  return (
    <DashboardCard title="Quick Actions" onAction={onViewAll}>
      <View style={styles.row}>
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.id}
            style={styles.item}
            onPress={() => onAction(action.id)}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <View style={[styles.iconBox, { backgroundColor: `${action.color}1a` }]}>
              <Ionicons name={action.icon} size={22} color={action.color} />
            </View>
            <Text style={[styles.label, { color: theme.colors.textMuted }]} numberOfLines={1}>
              {action.label.replace('Add ', '')}
            </Text>
          </Pressable>
        ))}
      </View>
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
    paddingHorizontal: 2,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
