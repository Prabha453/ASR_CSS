import { useInfiniteQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/app/store/hooks';
import { USER_PAGE_SIZE } from '../constants/user.constants';
import { userService } from '../services/user.service';
import { UserListFilters } from '../types/user.types';

export const userListQueryKey = (filters: UserListFilters) =>
  ['user', 'list', filters] as const;

export const useUserList = (filters: UserListFilters) => {
  const portDb = useAppSelector((state) => state.auth.portDb);

  return useInfiniteQuery({
    queryKey: userListQueryKey(filters),
    queryFn: ({ pageParam = 1 }) =>
      userService.getList({
        page: pageParam,
        limit: USER_PAGE_SIZE,
        search: filters.search || undefined,
        user_status: filters.status || undefined,
        user_role: filters.role || undefined,
      }),
    initialPageParam: 1,
    enabled: Boolean(portDb),
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
  });
};
