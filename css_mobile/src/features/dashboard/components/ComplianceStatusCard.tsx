import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { COMPLIANCE_STATUS } from '../constants/dashboard.constants';
import { DashboardCard } from './DashboardCard';

type ComplianceStatusCardProps = {
  onViewAll?: () => void;
  onAttentionPress?: () => void;
};

export function ComplianceStatusCard({ onViewAll, onAttentionPress }: ComplianceStatusCardProps) {
  const { theme } = useTheme();

  const pieData = COMPLIANCE_STATUS.slices.map((slice) => ({
    value: slice.value,
    color: slice.color,
  }));

  return (
    <DashboardCard title="Compliance Status" onAction={onViewAll}>
      <View style={styles.body}>
        <PieChart
          data={pieData}
          donut
          radius={58}
          innerRadius={40}
          innerCircleColor={theme.colors.card}
          centerLabelComponent={() => (
            <View style={styles.center}>
              <Text style={[styles.centerValue, { color: theme.colors.text }]}>
                {COMPLIANCE_STATUS.percent}%
              </Text>
              <Text style={[styles.centerLabel, { color: theme.colors.textMuted }]}>Compliant</Text>
            </View>
          )}
        />

        <View style={styles.legend}>
          {COMPLIANCE_STATUS.slices.map((slice) => (
            <View key={slice.label} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: slice.color }]} />
              <Text style={[styles.legendLabel, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {slice.label}
              </Text>
              <Text style={[styles.legendValue, { color: slice.color }]}>
                {slice.percent}% ({slice.value})
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Pressable
        style={[styles.banner, { backgroundColor: `${theme.colors.info}14` }]}
        onPress={onAttentionPress}
      >
        <Ionicons name="information-circle" size={18} color={theme.colors.info} />
        <Text style={[styles.bannerText, { color: theme.colors.info }]} numberOfLines={1}>
          {COMPLIANCE_STATUS.attention} items require your attention
        </Text>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.info} />
      </Pressable>
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 14,
  },
  center: {
    alignItems: 'center',
  },
  centerValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  legend: {
    flex: 1,
    gap: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
});
