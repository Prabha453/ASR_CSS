import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { DashboardStackParamList } from '@/app/navigation/types';
import { AppHeader, ScreenShell } from '@/shared/components/layout';
import { designSystem, textStyles } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';
import { ActivityRow } from '../components/ActivityRow';
import { dashboardService } from '../services/dashboard.service';

type Props = NativeStackScreenProps<DashboardStackParamList, 'RecentActivity'>;

const PAGE_LIMIT = 50;

export function RecentActivityScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard', 'recent-activity', PAGE_LIMIT],
    queryFn: () => dashboardService.getRecentActivity(PAGE_LIMIT),
  });

  const items = data ?? [];

  return (
    <ScreenShell
      scrollable={false}
      contentStyle={styles.content}
      header={
        <AppHeader
          title="Recent Activity"
          subtitle="Latest system actions"
          titleAlign="left"
          leftAction="back"
          onLeftPress={() => navigation.goBack()}
        />
      }
    >
      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 24 }} />
      ) : null}

      {isError ? (
        <Pressable onPress={() => void refetch()} style={styles.center}>
          <Text style={[textStyles.description, { color: theme.colors.danger }]}>
            Could not load activity. Tap to retry.
          </Text>
        </Pressable>
      ) : null}

      {!isLoading && !isError ? (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={[textStyles.description, { color: theme.colors.textMuted }]}>
                No recent activity yet.
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
          )}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
              <ActivityRow item={item} />
            </View>
          )}
        />
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: designSystem.screenPadding,
    flex: 1,
  },
  list: {
    gap: 10,
    paddingBottom: 28,
    flexGrow: 1,
  },
  card: {
    borderRadius: 14,
    padding: 12,
    shadowColor: '#212529',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  separator: {
    height: 0,
  },
  center: {
    alignItems: 'center',
    paddingVertical: 40,
  },
});
