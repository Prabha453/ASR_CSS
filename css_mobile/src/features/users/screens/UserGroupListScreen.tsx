import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UsersStackParamList } from '@/app/navigation/types';
import { EmptyState } from '@/shared/components/common/EmptyState';
import { useToast } from '@/shared/components/common/ToastProvider';
import { useTheme } from '@/shared/theme/ThemeContext';
import { designSystem } from '@/shared/theme/designSystem';
import {
  UserActionItem,
  UserActionSheet,
  UserGroupCard,
  UsersFab,
  UsersListHeader,
} from '../components';
import { useUserGroupList, userGroupListQueryKey } from '../hooks/useUserGroupList';
import { userGroupService } from '../services/userGroup.service';
import { UserGroup } from '../types/userGroup.types';

type Props = NativeStackScreenProps<UsersStackParamList, 'UserGroupList'>;

const GROUP_ACTIONS: UserActionItem[] = [
  { id: 'edit', label: 'Edit Group', icon: 'create-outline' },
  { id: 'delete', label: 'Delete Group', icon: 'trash-outline', destructive: true },
];

export function UserGroupListScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionGroup, setActionGroup] = useState<UserGroup | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const filters = useMemo(() => ({ search: debouncedSearch }), [debouncedSearch]);

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useUserGroupList(filters);

  const deleteMutation = useMutation({
    mutationFn: (groupId: number) => userGroupService.delete(groupId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user-group'] });
      showToast('User group deleted successfully.', { type: 'success' });
    },
    onError: (error: Error) => showToast(error.message, { type: 'error' }),
  });

  const groups = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);
  const totalItems = data?.pages[0]?.totalItems ?? 0;
  const refreshing = isRefetching && !isFetchingNextPage;

  const handleRefresh = () => {
    void Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: userGroupListQueryKey(filters) }),
    ]);
  };

  const openForm = (group?: UserGroup) => {
    navigation.navigate('UserGroupForm', group ? { userGroupId: group.user_group_id } : undefined);
  };

  const confirmDelete = (group: UserGroup) => {
    Alert.alert('Delete Group', `Are you sure you want to delete ${group.group_name ?? 'this group'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(group.user_group_id),
      },
    ]);
  };

  const handleAction = (actionId: string) => {
    if (!actionGroup) return;
    const group = actionGroup;
    setActionGroup(null);
    if (actionId === 'edit') {
      openForm(group);
    } else if (actionId === 'delete') {
      confirmDelete(group);
    }
  };

  const renderItem = ({ item }: { item: UserGroup }) => (
    <UserGroupCard
      group={item}
      onPress={() => openForm(item)}
      onMenuPress={() => setActionGroup(item)}
    />
  );

  const listEmpty = isLoading ? (
    <View style={styles.loadingWrap}>
      <ActivityIndicator size="small" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Loading groups...</Text>
    </View>
  ) : isError ? (
    <EmptyState
      title="Could not load groups"
      description="Pull to refresh and try again."
      icon="alert-circle-outline"
    />
  ) : (
    <EmptyState
      title="No user groups"
      description="Create a group to manage permissions."
      icon="people-outline"
      actionLabel="Add Group"
      onAction={() => openForm()}
    />
  );

  const listFooter = isFetchingNextPage ? (
    <ActivityIndicator size="small" color={theme.colors.primary} style={styles.footerLoader} />
  ) : null;

  const listHeader =
    totalItems > 0 ? (
      <Text style={[styles.count, { color: theme.colors.textMuted }]}>
        {totalItems} {totalItems === 1 ? 'group' : 'groups'}
      </Text>
    ) : null;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.primary }]}>
      <UsersListHeader
        title="User Groups"
        subtitle="Roles and module permissions"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search groups..."
        onBack={() => navigation.goBack()}
      />

      <View style={[styles.sheet, { backgroundColor: theme.colors.background }]}>
        <FlatList
          data={groups}
          keyExtractor={(item) => String(item.user_group_id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          ListFooterComponent={listFooter}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              void fetchNextPage();
            }
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
          }
        />
      </View>

      <UsersFab onPress={() => openForm()} accessibilityLabel="Add Group" />

      <UserActionSheet
        visible={Boolean(actionGroup)}
        title={actionGroup?.group_name ?? undefined}
        actions={GROUP_ACTIONS}
        onClose={() => setActionGroup(null)}
        onAction={handleAction}
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
  count: {
    fontSize: 12,
    marginLeft: 2,
    marginBottom: 10,
  },
  listContent: {
    padding: designSystem.screenPadding,
    paddingBottom: designSystem.sectionGap * 3,
    flexGrow: 1,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: { fontSize: 13 },
  footerLoader: { marginVertical: 16 },
});
