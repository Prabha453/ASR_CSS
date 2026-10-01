import { apiClient, buildPortUrl } from '@/shared/services/apiClient';
import { ApiResponse, PaginatedResponse } from '@/shared/types';
import {
  EntityShare,
  EntityShareDecimalSettings,
  EntityShareHistory,
  EntityShareListParams,
  EntityShareListResult,
  EntitySharePayload,
} from '../types/entityShare.types';

const DEFAULT_PAGE_SIZE = 20;

function toListResult(payload: PaginatedResponse<EntityShare> | undefined): EntityShareListResult {
  return {
    totalItems: payload?.totalItems ?? 0,
    totalPages: payload?.totalPages ?? 0,
    currentPage: payload?.currentPage ?? 1,
    data: payload?.data ?? [],
  };
}

export const entityShareService = {
  getList: async (params: EntityShareListParams): Promise<EntityShareListResult> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<EntityShare>>>(
      buildPortUrl(`/entity-shares/${params.entity_id}/list`),
      {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? DEFAULT_PAGE_SIZE,
          ...(params.currency ? { currency: params.currency } : {}),
          ...(params.share_class_id ? { share_class_id: params.share_class_id } : {}),
          ...(params.share_type ? { share_type: params.share_type } : {}),
        },
      },
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to load entity shares');
    }

    return toListResult(response.data.data);
  },

  getHistory: async (
    entityId: number,
    params?: { page?: number; limit?: number },
  ): Promise<EntityShareListResult> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<EntityShareHistory>>>(
      buildPortUrl(`/entity-shares/${entityId}/history`),
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? DEFAULT_PAGE_SIZE,
        },
      },
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to load share history');
    }

    return toListResult(response.data.data as PaginatedResponse<EntityShare>);
  },

  getById: async (id: number): Promise<EntityShare> => {
    const response = await apiClient.get<ApiResponse<EntityShare>>(
      buildPortUrl(`/entity-shares/get/${id}`),
    );

    if (!response.data.status || !response.data.data) {
      throw new Error(response.data.message || 'Failed to load share');
    }

    return response.data.data;
  },

  create: async (payload: EntitySharePayload): Promise<EntityShare> => {
    const response = await apiClient.post<ApiResponse<EntityShare>>(
      buildPortUrl('/entity-shares/create'),
      payload,
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to create share');
    }

    return response.data.data as EntityShare;
  },

  update: async (id: number, payload: Partial<EntitySharePayload>): Promise<EntityShare> => {
    const response = await apiClient.put<ApiResponse<EntityShare>>(
      buildPortUrl(`/entity-shares/update/${id}`),
      payload,
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to update share');
    }

    return response.data.data as EntityShare;
  },

  delete: async (id: number): Promise<void> => {
    const response = await apiClient.post<ApiResponse<unknown>>(buildPortUrl('/entity-shares/delete'), {
      id,
    });

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to delete share');
    }
  },

  getDecimalSettings: async (entityId: number): Promise<EntityShareDecimalSettings> => {
    const response = await apiClient.get<ApiResponse<EntityShareDecimalSettings>>(
      buildPortUrl(`/entity-share-decimal-settings/${entityId}`),
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to load decimal settings');
    }

    return response.data.data ?? {};
  },

  upsertDecimalSettings: async (
    entityId: number,
    payload: EntityShareDecimalSettings,
  ): Promise<EntityShareDecimalSettings> => {
    const response = await apiClient.post<ApiResponse<EntityShareDecimalSettings>>(
      buildPortUrl(`/entity-share-decimal-settings/${entityId}`),
      payload,
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to save decimal settings');
    }

    return response.data.data ?? payload;
  },
};
