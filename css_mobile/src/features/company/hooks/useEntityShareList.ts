import { useInfiniteQuery } from '@tanstack/react-query';
import { ENTITY_SHARE_PAGE_SIZE } from '../constants/entityShare.constants';
import { entityShareService } from '../services/entityShare.service';
import { EntityShareListParams, EntityShareType } from '../types/entityShare.types';

type UseEntityShareListParams = {
  entityId: number;
  currency?: string;
  shareClassId?: number;
  shareType?: EntityShareType;
};

export function useEntityShareList({
  entityId,
  currency,
  shareClassId,
  shareType,
}: UseEntityShareListParams) {
  return useInfiniteQuery({
    queryKey: ['entity-shares', entityId, currency, shareClassId, shareType],
    queryFn: ({ pageParam = 1 }) =>
      entityShareService.getList({
        entity_id: entityId,
        page: pageParam,
        limit: ENTITY_SHARE_PAGE_SIZE,
        ...(currency ? { currency } : {}),
        ...(shareClassId ? { share_class_id: shareClassId } : {}),
        ...(shareType ? { share_type: shareType } : {}),
      } satisfies EntityShareListParams),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
    enabled: entityId > 0,
  });
}
