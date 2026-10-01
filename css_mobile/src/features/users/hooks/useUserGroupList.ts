import { useInfiniteQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/app/store/hooks';
import { USER_GROUP_PAGE_SIZE } from '../constants/permissions.constants';
import { userGroupService } from '../services/userGroup.service';
import { UserGroupListFilters } from '../types/userGroup.types';

export const userGroupListQueryKey = (filters: UserGroupListFilters) =>
  ['user-group', 'list', filters] as const;

export const useUserGroupList = (filters: UserGroupListFilters) => {
  const portDb = useAppSelector((state) => state.auth.portDb);

  return useInfiniteQuery({
    queryKey: userGroupListQueryKey(filters),
    queryFn: ({ pageParam = 1 }) =>
      userGroupService.getList({
        page: pageParam,
        limit: USER_GROUP_PAGE_SIZE,
        search: filters.search || undefined,
      }),
    initialPageParam: 1,
    enabled: Boolean(portDb),
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
  });
};
