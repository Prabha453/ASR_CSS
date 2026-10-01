import { useInfiniteQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/app/store/hooks';
import { COMPANY_PAGE_SIZE } from '../constants/company.constants';
import { companyService } from '../services/company.service';
import { CompanyListFilters } from '../types/company.types';
import { getCompanySortParams } from '../utils/company.utils';

export const companyListQueryKey = (filters: CompanyListFilters) =>
  ['company', 'list', filters] as const;

export const useCompanyList = (filters: CompanyListFilters) => {
  const portDb = useAppSelector((state) => state.auth.portDb);
  const sortParams = getCompanySortParams(filters.sort);

  return useInfiniteQuery({
    queryKey: companyListQueryKey(filters),
    queryFn: ({ pageParam = 1 }) =>
      companyService.getList({
        page: pageParam,
        limit: COMPANY_PAGE_SIZE,
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
