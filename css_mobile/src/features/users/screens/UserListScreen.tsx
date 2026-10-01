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
  UserCard,
  UsersFab,
  UsersListHeader,
} from '../components';
import { useUserList, userListQueryKey } from '../hooks/useUserList';
import { useUserGroups } from '../hooks/useUserGroups';
import { userService } from '../services/user.service';
import { User } from '../types/user.types';
import { getUserFullName } from '../utils/user.utils';

type Props = NativeStackScreenProps<UsersStackParamList, 'UserList'>;

const USER_ACTIONS: UserActionItem[] = [
  { id: 'edit', label: 'Edit User', icon: 'create-outline' },
  { id: 'permissions', label: 'Manage Permissions', icon: 'shield-checkmark-outline' },
  { id: 'delete', label: 'Delete User', icon: 'trash-outline', destructive: true },
];

export function UserListScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionUser, setActionUser] = useState<User | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const filters = useMemo(
    () => ({ search: debouncedSearch, status: '', role: '' }),
    [debouncedSearch],
  );

  const { data: groups } = useUserGroups();
  const groupNameById = useMemo(() => {
    const map = new Map<number, string>();
    (groups ?? []).forEach((group) => {
      if (group.user_group_id) map.set(group.user_group_id, group.group_name ?? '');
    });
    return map;
  }, [groups]);

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useUserList(filters);

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => userService.delete(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user'] });
      showToast('User deleted successfully.', { type: 'success' });
    },
    onError: (error: Error) => showToast(error.message, { type: 'error' }),
  });

  const users = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);
  const totalItems = data?.pages[0]?.totalItems ?? 0;
  const refreshing = isRefetching && !isFetchingNextPage;

  const handleRefresh = () => {
    void Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: userListQueryKey(filters) }),
    ]);
  };

  const openForm = (user?: User) => {
    navigation.navigate('UserForm', user ? { userId: user.user_id } : undefined);
  };

  const confirmDelete = (user: User) => {
    Alert.alert('Delete User', `Are you sure you want to delete ${getUserFullName(user)}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(user.user_id) },
    ]);
  };

  const handleAction = (actionId: string) => {
    if (!actionUser) return;
    const user = actionUser;
    setActionUser(null);
    if (actionId === 'edit') {
      openForm(user);
    } else if (actionId === 'permissions') {
      navigation.navigate('UserPermissions', {
        userId: user.user_id,
        name: getUserFullName(user),
      });
    } else if (actionId === 'delete') {
      confirmDelete(user);
    }
  };

  const renderItem = ({ item }: { item: User }) => (
    <UserCard
      user={item}
      groupName={item.user_group_id ? groupNameById.get(item.user_group_id) : undefined}
      onPress={() => openForm(item)}
      onMenuPress={() => setActionUser(item)}
    />
  );

  const listEmpty = isLoading ? (
    <View style={styles.loadingWrap}>
      <ActivityIndicator size="small" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Loading users...</Text>
    </View>
  ) : isError ? (
    <EmptyState
      title="Could not load users"
      description="Pull to refresh and try again."
      icon="alert-circle-outline"
    />
  ) : (
    <EmptyState
      title="No users found"
      description="Add your first user to get started."
      icon="people-outline"
      actionLabel="Add User"
      onAction={() => openForm()}
    />
  );

  const listFooter = isFetchingNextPage ? (
    <ActivityIndicator size="small" color={theme.colors.primary} style={styles.footerLoader} />
  ) : null;

  const listHeader =
    totalItems > 0 ? (
      <Text style={[styles.count, { color: theme.colors.textMuted }]}>
        {totalItems} {totalItems === 1 ? 'user' : 'users'}
      </Text>
    ) : null;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.primary }]}>
      <UsersListHeader
        title="Users"
        subtitle="Manage user accounts and access"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users..."
        onBack={() => navigation.goBack()}
      />

      <View style={[styles.sheet, { backgroundColor: theme.colors.background }]}>
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.user_id)}
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

      <UsersFab onPress={() => openForm()} accessibilityLabel="Add User" />

      <UserActionSheet
        visible={Boolean(actionUser)}
        title={actionUser ? getUserFullName(actionUser) : undefined}
        actions={USER_ACTIONS}
        onClose={() => setActionUser(null)}
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
