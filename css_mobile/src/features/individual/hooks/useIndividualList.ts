import { useInfiniteQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/app/store/hooks';
import { INDIVIDUAL_PAGE_SIZE } from '../constants/individual.constants';
import { individualService } from '../services/individual.service';
import { IndividualListFilters } from '../types/individual.types';
import { getIndividualSortParams } from '../utils/individual.utils';

export const individualListQueryKey = (filters: IndividualListFilters) =>
  ['individual', 'list', filters] as const;

export const useIndividualList = (filters: IndividualListFilters) => {
  const portDb = useAppSelector((state) => state.auth.portDb);
  const sortParams = getIndividualSortParams(filters.sort);

  return useInfiniteQuery({
    queryKey: individualListQueryKey(filters),
    queryFn: ({ pageParam = 1 }) =>
      individualService.getList({
        page: pageParam,
        limit: INDIVIDUAL_PAGE_SIZE,
        search: filters.search || undefined,
        status: filters.status || undefined,
        risk: filters.risk || undefined,
        sort: sortParams.sort,
        order: sortParams.order,
      }),
    initialPageParam: 1,
    enabled: Boolean(portDb),
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
  });
};
