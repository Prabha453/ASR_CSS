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
import { useAppSelector } from '@/app/store/hooks';
import { getProfileInitials } from '@/features/settings/utils/settings.utils';
import { useToast } from '@/shared/components/common/ToastProvider';
import { useTheme } from '@/shared/theme/ThemeContext';
import { designSystem } from '@/shared/theme/designSystem';
import { CompanySortOption } from '../constants/company.constants';
import { CompanyActionId } from '../constants/companyView.constants';
import {
  CompanyActionSheet,
  CompanyCard,
  CompanyFab,
  CompanyFilterModal,
  CompanyGridCard,
  CompanyListEmpty,
  CompanyListHeader,
  CompanyListMetaRow,
  CompanyListSummary,
} from '../components';
import { COMPANY_KPIS_QUERY_KEY, useCompanyKpis } from '../hooks/useCompanyKpis';
import { companyListQueryKey, useCompanyList } from '../hooks/useCompanyList';
import { companyService } from '../services/company.service';
import { Company } from '../types/company.types';

type Props = NativeStackScreenProps<EntitiesStackParamList, 'CompanyList'>;

export function CompanyListScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { width: screenWidth } = useWindowDimensions();
  const profile = useAppSelector((state) => state.user.profile);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [risk, setRisk] = useState('');
  const [sort, setSort] = useState<CompanySortOption>('latest');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterOpen, setFilterOpen] = useState(false);
  const [actionCompany, setActionCompany] = useState<Company | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const filters = useMemo(
    () => ({ search: debouncedSearch, status, risk, sort }),
    [debouncedSearch, status, risk, sort],
  );

  const { data: kpis, isLoading: kpisLoading, refetch: refetchKpis } = useCompanyKpis();
  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useCompanyList(filters);

  const deleteMutation = useMutation({
    mutationFn: (entityId: number) => companyService.delete(entityId),
    onSuccess: async () => {
      setActionCompany(null);
      await queryClient.invalidateQueries({ queryKey: ['company'] });
      await queryClient.invalidateQueries({ queryKey: COMPANY_KPIS_QUERY_KEY });
      showToast('Company deleted successfully.', { type: 'success' });
    },
    onError: (error: Error) => {
      showToast(error.message, { type: 'error' });
    },
  });

  const companies = useMemo(
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
      queryClient.invalidateQueries({ queryKey: companyListQueryKey(filters) }),
      queryClient.invalidateQueries({ queryKey: COMPANY_KPIS_QUERY_KEY }),
    ]);
  };

  const openFilters = () => {
    setFilterOpen(true);
  };

  const handleAddCompany = () => {
    navigation.navigate('CompanyAdd');
  };

  const confirmDelete = (company: Company) => {
    Alert.alert(
      'Delete Company',
      `Are you sure you want to delete ${company.name ?? 'this company'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(company.entity_id),
        },
      ],
    );
  };

  const handleCardAction = (actionId: CompanyActionId) => {
    if (!actionCompany) return;
    if (actionId === 'edit') {
      navigation.navigate('CompanyAdd', { entityId: actionCompany.entity_id });
      return;
    }
    if (actionId === 'officials') {
      navigation.navigate('OfficialsDetail', {
        entityId: actionCompany.entity_id,
        name: actionCompany.name,
      });
      return;
    }
    if (actionId === 'documents') {
      navigation.navigate('CompanyView', {
        entityId: actionCompany.entity_id,
        name: actionCompany.name,
      });
      return;
    }
    if (actionId === 'deactivate') {
      confirmDelete(actionCompany);
    }
  };

  const renderListItem = ({ item }: { item: Company }) => (
    <CompanyCard
      company={item}
      compact={false}
      onPress={() =>
        navigation.navigate('CompanyView', {
          entityId: item.entity_id,
          name: item.name,
        })
      }
      onMenuPress={() => setActionCompany(item)}
    />
  );

  const renderGridItem = ({ item }: { item: Company }) => (
    <CompanyGridCard
      company={item}
      width={gridCardWidth}
      onPress={() =>
        navigation.navigate('CompanyView', {
          entityId: item.entity_id,
          name: item.name,
        })
      }
      onMenuPress={() => setActionCompany(item)}
    />
  );

  const listEmpty = isLoading ? (
    <View style={styles.loadingWrap}>
      <ActivityIndicator size="small" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
        Loading companies...
      </Text>
    </View>
  ) : (
    <CompanyListEmpty onAddCompany={handleAddCompany} />
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
      <CompanyListSummary
        status={status}
        kpis={kpis}
        isLoading={kpisLoading}
        onStatusChange={setStatus}
      />
      <CompanyListMetaRow
        totalCount={totalItems}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      {isError ? (
        <Pressable
          style={[styles.errorCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={handleRefresh}
        >
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Could not load companies. Tap to retry.
          </Text>
        </Pressable>
      ) : null}
    </>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.primary }]}>
      <CompanyListHeader
        search={search}
        onSearchChange={setSearch}
        onFiltersPress={openFilters}
        profileInitials={getProfileInitials(profile)}
        hasActiveFilters={hasActiveFilters}
      />

      <View key={viewMode} style={[styles.sheet, { backgroundColor: theme.colors.background }]}>
        {viewMode === 'list' ? (
          <FlatList
            key="company-list-view"
            style={styles.list}
            data={companies}
            keyExtractor={(item) => `list-${item.entity_id}`}
            renderItem={renderListItem}
            numColumns={1}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={listEmpty}
            ListFooterComponent={listFooter}
            contentContainerStyle={styles.listContent}
            refreshControl={refreshControl}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                void fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.4}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            key="company-grid-view"
            style={styles.list}
            data={companies}
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
              if (hasNextPage && !isFetchingNextPage) {
                void fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.4}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <CompanyFab onPress={handleAddCompany} />

      <CompanyActionSheet
        visible={Boolean(actionCompany)}
        companyName={actionCompany?.name}
        onClose={() => setActionCompany(null)}
        onAction={handleCardAction}
      />

      <CompanyFilterModal
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
  root: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    marginTop: -4,
  },
  list: {
    flex: 1,
  },
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
  loadingText: {
    fontSize: 13,
  },
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
  footerLoader: {
    marginVertical: 16,
  },
  footerSpacer: {
    height: 72,
  },
});
