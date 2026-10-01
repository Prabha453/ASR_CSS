import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { EntitiesStackParamList } from '@/app/navigation/types';
import { PrimaryButton } from '@/shared/components/common/PrimaryButton';
import { EditIcon } from '@/shared/components/common/EditIcon';
import { useToast } from '@/shared/components/common/ToastProvider';
import { designSystem } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';
import { useEntityShareContext } from '../hooks/useEntityShareContext';
import { useEntityShareList } from '../hooks/useEntityShareList';
import { entityShareService } from '../services/entityShare.service';
import { Company } from '../types/company.types';
import { EntityShare, EntityShareType } from '../types/entityShare.types';
import { EntityShareActionId, EntityShareActionSheet } from './EntityShareActionSheet';
import { EntityShareCard } from './EntityShareCard';
import { EntityShareDecimalSheet } from './EntityShareDecimalSheet';
import { EntityShareFilterBar } from './EntityShareFilterBar';
import { EntityShareFilterSheet } from './EntityShareFilterSheet';
import { EntityShareHistorySheet } from './EntityShareHistorySheet';
import { ShareBreakdownCard } from './ShareBreakdownCard';

type Navigation = NativeStackNavigationProp<EntitiesStackParamList>;

type CompanyViewSharesProps = {
  company: Company;
  navigation: Navigation;
};

export function CompanyViewShares({ company, navigation }: CompanyViewSharesProps) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const entityId = company.entity_id;

  const [filterCurrency, setFilterCurrency] = useState('');
  const [filterType, setFilterType] = useState<EntityShareType | ''>('');
  const [selectedShare, setSelectedShare] = useState<EntityShare | null>(null);
  const [actionVisible, setActionVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [decimalSheetVisible, setDecimalSheetVisible] = useState(false);

  const shareContext = useEntityShareContext(company);

  const listQuery = useEntityShareList({
    entityId,
    currency: filterCurrency || undefined,
    shareType: filterType || undefined,
  });

  const filterOptionsQuery = useQuery({
    queryKey: ['entity-shares', entityId, 'filter-options'],
    queryFn: () => entityShareService.getList({ entity_id: entityId, page: 1, limit: 200 }),
    enabled: entityId > 0,
  });

  const shares = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [listQuery.data],
  );

  const currencyOptions = useMemo(() => {
    const source = filterOptionsQuery.data?.data ?? shares;
    return [...new Set(source.map((share) => share.currency).filter(Boolean))].sort();
  }, [filterOptionsQuery.data, shares]);

  const deleteMutation = useMutation({
    mutationFn: (shareId: number) => entityShareService.delete(shareId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['entity-shares', entityId] });
      showToast('Share deleted successfully.', { type: 'success' });
    },
    onError: (error: Error) => showToast(error.message, { type: 'error' }),
  });

  const openForm = (shareId?: number) => {
    navigation.navigate('EntityShareForm', {
      entityId,
      shareId,
      isGuarantee: shareContext.isGuarantee,
      isAuthorizedCapital: shareContext.isAuthorizedCapital,
    });
  };

  const handleAction = (action: EntityShareActionId) => {
    if (!selectedShare) return;
    if (action === 'history') {
      setHistoryVisible(true);
      return;
    }
    if (action === 'edit') {
      openForm(selectedShare.id);
      return;
    }
    Alert.alert('Delete Share', 'Are you sure you want to delete this share record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(selectedShare.id),
      },
    ]);
  };

  const resetFilters = () => {
    setFilterCurrency('');
    setFilterType('');
  };

  const shareLabel = selectedShare
    ? `${selectedShare.currency} · ${selectedShare.share_class?.sc_name ?? `Class #${selectedShare.share_class_id}`}`
    : undefined;

  return (
    <View style={styles.wrap}>
      {shares.length > 0 || listQuery.isLoading ? (
        <ShareBreakdownCard shares={shares} />
      ) : null}

      <View style={styles.toolbar}>
        <EntityShareFilterBar
          currency={filterCurrency}
          shareType={filterType}
          onPress={() => setFilterSheetVisible(true)}
          style={styles.filterBar}
        />
        <Pressable
          onPress={() => setFilterSheetVisible(true)}
          style={[styles.editBtn, { backgroundColor: `${theme.colors.purple}18` }]}
        >
          <EditIcon size={16} color={theme.colors.purple} />
        </Pressable>
        <Pressable
          onPress={() => setDecimalSheetVisible(true)}
          style={[styles.iconBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        >
          <Ionicons name="calculator-outline" size={16} color={theme.colors.primary} />
        </Pressable>
        <Pressable
          onPress={() => openForm()}
          style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <EntityShareFilterSheet
        visible={filterSheetVisible}
        currencies={currencyOptions}
        currency={filterCurrency}
        shareType={filterType}
        onClose={() => setFilterSheetVisible(false)}
        onApply={(currency, shareType) => {
          setFilterCurrency(currency);
          setFilterType(shareType);
          setFilterSheetVisible(false);
        }}
        onReset={resetFilters}
      />

      {listQuery.isLoading ? (
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
      ) : shares.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.colors.card }]}>
          <Ionicons name="pie-chart-outline" size={24} color={theme.colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No shares recorded</Text>
          <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
            Add the first share record for this company.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {shares.map((share) => (
            <EntityShareCard
              key={share.id}
              share={share}
              decimals={shareContext.effectiveDecimals}
              isAuthorizedCapital={shareContext.isAuthorizedCapital}
              onPressMenu={() => {
                setSelectedShare(share);
                setActionVisible(true);
              }}
            />
          ))}
        </View>
      )}

      {listQuery.hasNextPage ? (
        <PrimaryButton
          label={listQuery.isFetchingNextPage ? 'Loading...' : 'Load More'}
          loading={listQuery.isFetchingNextPage}
          onPress={() => listQuery.fetchNextPage()}
          style={styles.loadMore}
        />
      ) : null}

      <EntityShareActionSheet
        visible={actionVisible}
        shareLabel={shareLabel}
        onClose={() => setActionVisible(false)}
        onAction={handleAction}
      />

      <EntityShareHistorySheet
        visible={historyVisible}
        entityId={entityId}
        shareId={selectedShare?.id}
        shareLabel={shareLabel}
        decimals={shareContext.effectiveDecimals}
        onClose={() => setHistoryVisible(false)}
      />

      <EntityShareDecimalSheet
        visible={decimalSheetVisible}
        entityId={entityId}
        globalDecimals={shareContext.globalDecimals}
        entityDecimals={shareContext.entityDecimals}
        onClose={() => setDecimalSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: designSystem.cardGap,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterBar: {
    flex: 1,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#405189',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  loader: {
    marginVertical: 24,
  },
  list: {
    gap: 10,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  loadMore: {
    marginTop: 4,
  },
});
