import { apiClient, buildPortUrl } from '@/shared/services/apiClient';
import { ApiResponse, PaginatedResponse } from '@/shared/types';
import { COMPANY_PAGE_SIZE } from '../constants/company.constants';
import {
  Company,
  CompanyKpis,
  CompanyListParams,
  CompanyListResult,
  CompanyPayload,
} from '../types/company.types';

function toListResult(payload: PaginatedResponse<Company> | undefined): CompanyListResult {
  return {
    totalItems: payload?.totalItems ?? 0,
    totalPages: payload?.totalPages ?? 0,
    currentPage: payload?.currentPage ?? 1,
    data: payload?.data ?? [],
  };
}

async function fetchListPage(params: CompanyListParams): Promise<CompanyListResult> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<Company>>>(
    buildPortUrl('/company/list'),
    {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? COMPANY_PAGE_SIZE,
        sort: params.sort ?? 'created_date',
        order: params.order ?? 'DESC',
        ...(params.search ? { search: params.search } : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.risk ? { risk: params.risk } : {}),
        ...(params.company_type_id ? { company_type_id: params.company_type_id } : {}),
        ...(params.country ? { country: params.country } : {}),
        ...(params.region_id ? { region_id: params.region_id } : {}),
      },
    },
  );

  if (!response.data.status) {
    throw new Error(response.data.message || 'Failed to load companies');
  }

  return toListResult(response.data.data);
}

export const companyService = {
  getList: fetchListPage,

  getById: async (entityId: number): Promise<Company> => {
    const response = await apiClient.get<ApiResponse<Company>>(
      buildPortUrl(`/company/get/${entityId}`),
    );

    if (!response.data.status || !response.data.data) {
      throw new Error(response.data.message || 'Failed to load company');
    }

    return response.data.data;
  },

  create: async (payload: CompanyPayload): Promise<{ entity_id: number }> => {
    const response = await apiClient.post<ApiResponse<{ entity_id: number }>>(
      buildPortUrl('/company/create'),
      payload,
    );

    if (!response.data.status || !response.data.data?.entity_id) {
      throw new Error(response.data.message || 'Failed to create company');
    }

    return response.data.data;
  },

  update: async (entityId: number, payload: CompanyPayload): Promise<{ entity_id: number }> => {
    const response = await apiClient.put<ApiResponse<{ entity_id: number }>>(
      buildPortUrl(`/company/update/${entityId}`),
      payload,
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to update company');
    }

    return response.data.data ?? { entity_id: entityId };
  },

  delete: async (entityId: number): Promise<void> => {
    const response = await apiClient.post<ApiResponse<unknown>>(buildPortUrl('/company/delete'), {
      entity_id: entityId,
    });

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to delete company');
    }
  },

  getKpis: async (): Promise<CompanyKpis> => {
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
