import { apiClient, buildPortUrl } from '@/shared/services/apiClient';
import { ApiResponse, PaginatedResponse } from '@/shared/types';

export type StoredDocument = {
  doc_id: number;
  doc_name?: string;
  original_file_name?: string;
  doc_category?: string;
  module_name?: string;
  entity_id?: number;
  entity_type?: string;
  cdn_url?: string;
  file_path?: string;
  created_at?: string;
  updated_at?: string;
};

export const documentStoreService = {
  getCompanyDocuments: async (entityId: number, page = 1, limit = 50) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<StoredDocument>>>(
      buildPortUrl('/document-store'),
      {
        params: {
          entity_id: entityId,
          entity_type: 'company',
          page,
          limit,
        },
      },
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to load documents');
    }

    return response.data.data;
  },
};
