import { apiClient, buildPortUrl } from '@/shared/services/apiClient';
import { ApiResponse, PaginatedResponse } from '@/shared/types';
import { MasterRecord, MasterResourceConfig } from '../types/settings.types';

export const masterDataService = {
  getList: async (config: MasterResourceConfig, page = 1, limit = 50, search = '') => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<MasterRecord>>>(
      buildPortUrl(config.listPath),
      {
        params: {
          page,
          limit,
          ...(config.order ? { order: config.order } : {}),
          ...(search ? { search } : {}),
        },
      },
    );

    if (!response.data.status) {
      throw new Error(response.data.message || `Failed to load ${config.title}`);
    }

    return response.data.data ?? { data: [], totalItems: 0, totalPages: 0, currentPage: 1 };
  },

  create: async (config: MasterResourceConfig, payload: MasterRecord, userId?: number) => {
    const response = await apiClient.post<ApiResponse<MasterRecord>>(
      buildPortUrl(config.createPath),
      { ...payload, ...(userId ? { updated_by: userId } : {}) },
    );

    if (!response.data.status) {
      throw new Error(response.data.message || `Failed to create ${config.title}`);
    }

    return response.data.data;
  },

  update: async (
    config: MasterResourceConfig,
    id: number,
    payload: MasterRecord,
    userId?: number,
  ) => {
    const response = await apiClient.put<ApiResponse<MasterRecord>>(
      buildPortUrl(config.updatePath(id)),
      { ...payload, ...(userId ? { updated_by: userId } : {}) },
    );

    if (!response.data.status) {
      throw new Error(response.data.message || `Failed to update ${config.title}`);
    }

    return response.data.data;
  },

  delete: async (config: MasterResourceConfig, id: number) => {
    const response = await apiClient.post<ApiResponse<unknown>>(buildPortUrl(config.deletePath), {
      [config.idField]: id,
    });

    if (!response.data.status) {
      throw new Error(response.data.message || `Failed to delete ${config.title}`);
    }
  },
};
