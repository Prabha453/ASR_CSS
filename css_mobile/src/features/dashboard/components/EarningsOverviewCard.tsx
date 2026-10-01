import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { EARNINGS_OVERVIEW } from '../constants/dashboard.constants';
import { DashboardCard } from './DashboardCard';

const CHART_WIDTH = Dimensions.get('window').width - 16 * 2 - 14 * 2;

export function EarningsOverviewCard() {
  const { theme } = useTheme();

  const data = EARNINGS_OVERVIEW.points.map((value) => ({ value }));

  return (
    <DashboardCard>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
          Earnings Overview
        </Text>
        <View style={[styles.periodChip, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.periodText, { color: theme.colors.textMuted }]}>
            {EARNINGS_OVERVIEW.period}
          </Text>
          <Ionicons name="chevron-down" size={11} color={theme.colors.textMuted} />
        </View>
      </View>

      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={1}>
          {EARNINGS_OVERVIEW.value}
        </Text>
        <View style={styles.changePill}>
          <Ionicons name="arrow-up" size={10} color={theme.colors.success} />
          <Text style={[styles.change, { color: theme.colors.success }]}>
            {EARNINGS_OVERVIEW.change}
          </Text>
        </View>
      </View>

      <View style={styles.chartWrap}>
        <LineChart
          data={data}
          width={CHART_WIDTH}
          height={110}
          adjustToWidth
          areaChart
          curved
          color={theme.colors.secondary}
          startFillColor={theme.colors.secondary}
          endFillColor={theme.colors.secondary}
          startOpacity={0.28}
          endOpacity={0.02}
          thickness={2}
          hideDataPoints
          hideRules
          hideYAxisText
          yAxisThickness={0}
          xAxisThickness={0}
          initialSpacing={0}
          endSpacing={0}
          disableScroll
        />
      </View>

      <View style={styles.labels}>
        {EARNINGS_OVERVIEW.labels.map((label) => (
          <Text key={label} style={[styles.labelText, { color: theme.colors.textMuted }]}>
            {label}
          </Text>
        ))}
      </View>
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  periodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  periodText: {
    fontSize: 11,
    fontWeight: '600',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    flexShrink: 1,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  change: {
    fontSize: 13,
    fontWeight: '700',
  },
  chartWrap: {
    overflow: 'hidden',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
