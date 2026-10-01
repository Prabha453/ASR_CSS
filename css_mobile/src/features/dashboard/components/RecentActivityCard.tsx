import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { textStyles } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';
import { dashboardService } from '../services/dashboard.service';
import { ActivityRow } from './ActivityRow';
import { DashboardCard } from './DashboardCard';

const PREVIEW_COUNT = 5;

type RecentActivityCardProps = {
  onViewMore?: () => void;
};

export function RecentActivityCard({ onViewMore }: RecentActivityCardProps) {
  const { theme } = useTheme();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', 'recent-activity', PREVIEW_COUNT],
    queryFn: () => dashboardService.getRecentActivity(PREVIEW_COUNT),
    refetchInterval: 60_000,
  });

  const items = data ?? [];
  const visibleItems = items.slice(0, PREVIEW_COUNT);

  const actionLabel = isError
    ? 'Retry'
    : onViewMore
      ? 'View more'
      : items.length > 0
        ? 'Refresh'
        : undefined;

  const handleAction = () => {
    if (isError) {
      void refetch();
      return;
    }
    if (onViewMore) {
      onViewMore();
      return;
    }
    void refetch();
  };

  return (
    <DashboardCard
      title="Recent Activity"
      onAction={actionLabel ? handleAction : undefined}
      actionLabel={actionLabel}
    >
      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 12 }} />
      ) : null}

      {isError ? (
        <Text style={[textStyles.description, { color: theme.colors.danger }]}>
          Could not load activity.
        </Text>
      ) : null}

      {!isLoading && !isError && items.length === 0 ? (
        <Text style={[textStyles.description, { color: theme.colors.textMuted }]}>
          No recent activity yet.
        </Text>
      ) : null}

      <View style={styles.list}>
        {visibleItems.map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
      </View>
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
});
