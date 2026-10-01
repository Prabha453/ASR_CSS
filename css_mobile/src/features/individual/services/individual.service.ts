import { apiClient, buildPortUrl } from '@/shared/services/apiClient';
import { ApiResponse, PaginatedResponse } from '@/shared/types';
import { INDIVIDUAL_PAGE_SIZE } from '../constants/individual.constants';
import {
  Individual,
  IndividualKpis,
  IndividualListParams,
  IndividualListResult,
  IndividualPayload,
} from '../types/individual.types';

function toListResult(payload: PaginatedResponse<Individual> | undefined): IndividualListResult {
  return {
    totalItems: payload?.totalItems ?? 0,
    totalPages: payload?.totalPages ?? 0,
    currentPage: payload?.currentPage ?? 1,
    data: payload?.data ?? [],
  };
}

async function fetchListPage(params: IndividualListParams): Promise<IndividualListResult> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<Individual>>>(
    buildPortUrl('/individual/list'),
    {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? INDIVIDUAL_PAGE_SIZE,
        sort: params.sort ?? 'created_date',
        order: params.order ?? 'DESC',
        ...(params.search ? { search: params.search } : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.risk ? { risk: params.risk } : {}),
        ...(params.nationality ? { nationality: params.nationality } : {}),
      },
    },
  );

  if (!response.data.status) {
    throw new Error(response.data.message || 'Failed to load individuals');
  }

  return toListResult(response.data.data);
}

export const individualService = {
  getList: fetchListPage,

  getById: async (entityId: number): Promise<Individual> => {
    const response = await apiClient.get<ApiResponse<Individual>>(
      buildPortUrl(`/individual/get/${entityId}`),
    );

    if (!response.data.status || !response.data.data) {
      throw new Error(response.data.message || 'Failed to load individual');
    }

    return response.data.data;
  },

  create: async (payload: IndividualPayload): Promise<{ entity_id: number }> => {
    const response = await apiClient.post<ApiResponse<{ entity_id: number }>>(
      buildPortUrl('/individual/create'),
      payload,
    );

    if (!response.data.status || !response.data.data?.entity_id) {
      throw new Error(response.data.message || 'Failed to create individual');
    }

    return response.data.data;
  },

  update: async (entityId: number, payload: IndividualPayload): Promise<{ entity_id: number }> => {
    const response = await apiClient.put<ApiResponse<{ entity_id: number }>>(
      buildPortUrl(`/individual/update/${entityId}`),
      payload,
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to update individual');
    }

    return response.data.data ?? { entity_id: entityId };
  },

  delete: async (entityId: number): Promise<void> => {
    const response = await apiClient.post<ApiResponse<unknown>>(buildPortUrl('/individual/delete'), {
      entity_id: entityId,
    });

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to delete individual');
    }
  },

  getKpis: async (): Promise<IndividualKpis> => {
    const [total, active, inactive, pending] = await Promise.all([
      fetchListPage({ page: 1, limit: 1 }),
      fetchListPage({ page: 1, limit: 1, status: 'ACTIVE' }),
      fetchListPage({ page: 1, limit: 1, status: 'INACTIVE' }),
      fetchListPage({ page: 1, limit: 1, status: 'PENDING' }),
    ]);

    return {
      total: total.totalItems,
      active: active.totalItems,
      inactive: inactive.totalItems,
      pending: pending.totalItems,
    };
  },
};
