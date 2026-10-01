import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EntitiesStackParamList } from '@/app/navigation/types';
import { useToast } from '@/shared/components/common/ToastProvider';
import { designSystem } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';
import { IndividualActionId, IndividualSortOption } from '../constants/individual.constants';
import {
  IndividualActionSheet,
  IndividualCard,
  IndividualFab,
  IndividualFilterModal,
  IndividualGridCard,
  IndividualListEmpty,
  IndividualListHeader,
  IndividualListMetaRow,
  IndividualStatusTabs,
} from '../components';
import { INDIVIDUAL_KPIS_QUERY_KEY, useIndividualKpis } from '../hooks/useIndividualKpis';
import { individualListQueryKey, useIndividualList } from '../hooks/useIndividualList';
import { individualService } from '../services/individual.service';
import { Individual } from '../types/individual.types';

type Props = NativeStackScreenProps<EntitiesStackParamList, 'IndividualList'>;

export function IndividualListScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { width: screenWidth } = useWindowDimensions();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [risk, setRisk] = useState('');
  const [sort, setSort] = useState<IndividualSortOption>('latest');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterOpen, setFilterOpen] = useState(false);
  const [actionIndividual, setActionIndividual] = useState<Individual | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const filters = useMemo(
    () => ({ search: debouncedSearch, status, risk, sort }),
    [debouncedSearch, status, risk, sort],
  );

  const { data: kpis, isLoading: kpisLoading, refetch: refetchKpis } = useIndividualKpis();
  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useIndividualList(filters);

  const deleteMutation = useMutation({
    mutationFn: (entityId: number) => individualService.delete(entityId),
    onSuccess: async () => {
      setActionIndividual(null);
      await queryClient.invalidateQueries({ queryKey: ['individual'] });
      await queryClient.invalidateQueries({ queryKey: INDIVIDUAL_KPIS_QUERY_KEY });
      showToast('Individual deleted successfully.', { type: 'success' });
    },
    onError: (error: Error) => showToast(error.message, { type: 'error' }),
  });

  const individuals = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );
  const totalItems = data?.pages[0]?.totalItems ?? 0;
  const refreshing = isRefetching && !isFetchingNextPage;
  const hasActiveFilters = Boolean(status || risk || debouncedSearch);
  const gridCardWidth =
    (screenWidth - designSystem.screenPadding * 2 - designSystem.listGap) / 2;

  const handleRefresh = () => {
    void Promise.all([
      refetch(),
      refetchKpis(),
      queryClient.invalidateQueries({ queryKey: individualListQueryKey(filters) }),
      queryClient.invalidateQueries({ queryKey: INDIVIDUAL_KPIS_QUERY_KEY }),
    ]);
  };

  const handleAdd = () => {
    navigation.navigate('IndividualAdd');
  };

  const confirmDelete = (person: Individual) => {
    Alert.alert(
      'Delete Individual',
      `Are you sure you want to delete ${person.name ?? 'this individual'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(person.entity_id),
        },
      ],
    );
  };

  const handleCardAction = (actionId: IndividualActionId) => {
    if (!actionIndividual) return;
    if (actionId === 'view') {
      navigation.navigate('IndividualView', {
        entityId: actionIndividual.entity_id,
        name: actionIndividual.name,
      });
      return;
    }
    if (actionId === 'edit') {
      navigation.navigate('IndividualAdd', { entityId: actionIndividual.entity_id });
      return;
    }
    if (actionId === 'delete') {
      confirmDelete(actionIndividual);
    }
  };

  const renderListItem = ({ item }: { item: Individual }) => (
    <IndividualCard
      individual={item}
      onPress={() =>
        navigation.navigate('IndividualView', {
          entityId: item.entity_id,
          name: item.name,
        })
      }
      onMenuPress={() => setActionIndividual(item)}
    />
  );

  const renderGridItem = ({ item }: { item: Individual }) => (
    <IndividualGridCard
      individual={item}
      width={gridCardWidth}
      onPress={() =>
        navigation.navigate('IndividualView', {
          entityId: item.entity_id,
          name: item.name,
        })
      }
      onMenuPress={() => setActionIndividual(item)}
    />
  );

  const listEmpty = isLoading ? (
    <View style={styles.loadingWrap}>
      <ActivityIndicator size="small" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
        Loading individuals...
      </Text>
    </View>
  ) : (
    <IndividualListEmpty onAdd={handleAdd} />
  );

  const listFooter = isFetchingNextPage ? (
    <ActivityIndicator size="small" color={theme.colors.primary} style={styles.footerLoader} />
  ) : (
    <View style={styles.footerSpacer} />
  );

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={theme.colors.primary}
    />
  );

  const listHeader = (
    <>
      <IndividualStatusTabs
        status={status}
        kpis={kpis}
        isLoading={kpisLoading}
        onStatusChange={setStatus}
      />
      <IndividualListMetaRow
        totalCount={totalItems}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      {isError ? (
        <Pressable
          style={[
            styles.errorCard,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
          onPress={handleRefresh}
        >
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Could not load individuals. Tap to retry.
          </Text>
        </Pressable>
      ) : null}
    </>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.primary }]}>
      <IndividualListHeader
        search={search}
        onSearchChange={setSearch}
        onFiltersPress={() => setFilterOpen(true)}
        hasActiveFilters={hasActiveFilters}
      />

      <View key={viewMode} style={[styles.sheet, { backgroundColor: theme.colors.background }]}>
        {viewMode === 'list' ? (
          <FlatList
            key="individual-list-view"
            style={styles.list}
            data={individuals}
            keyExtractor={(item) => `list-${item.entity_id}`}
            renderItem={renderListItem}
            numColumns={1}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={listEmpty}
            ListFooterComponent={listFooter}
            contentContainerStyle={styles.listContent}
            refreshControl={refreshControl}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
            }}
            onEndReachedThreshold={0.4}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            key="individual-grid-view"
            style={styles.list}
            data={individuals}
            keyExtractor={(item) => `grid-${item.entity_id}`}
            renderItem={renderGridItem}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={listEmpty}
            ListFooterComponent={listFooter}
            contentContainerStyle={styles.listContent}
            refreshControl={refreshControl}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
            }}
            onEndReachedThreshold={0.4}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <IndividualFab onPress={handleAdd} />

      <IndividualActionSheet
        visible={Boolean(actionIndividual)}
        individualName={actionIndividual?.name}
        onClose={() => setActionIndividual(null)}
        onAction={handleCardAction}
      />

      <IndividualFilterModal
        visible={filterOpen}
        risk={risk}
        sort={sort}
        onClose={() => setFilterOpen(false)}
        onApply={(nextRisk, nextSort) => {
          setRisk(nextRisk);
          setSort(nextSort);
          setFilterOpen(false);
        }}
        onReset={() => {
          setRisk('');
          setSort('latest');
          setFilterOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    marginTop: -4,
  },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: designSystem.screenPadding,
    paddingTop: designSystem.screenPadding,
    paddingBottom: 100,
    flexGrow: 1,
  },
  gridRow: {
    gap: designSystem.listGap,
    marginBottom: designSystem.listGap,
    alignItems: 'flex-start',
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  loadingText: { fontSize: 13 },
  errorCard: {
    borderWidth: 1,
    borderRadius: designSystem.formRadius,
    padding: 12,
    marginBottom: designSystem.cardGap,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  footerLoader: { marginVertical: 16 },
  footerSpacer: { height: 72 },
});
