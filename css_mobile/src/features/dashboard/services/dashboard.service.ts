import { apiClient, buildPortUrl } from '@/shared/services/apiClient';
import { ApiResponse } from '@/shared/types';

export type DashboardActivityUser = {
  user_id?: number;
  user_name?: string;
  first_name?: string;
  last_name?: string;
  profile_photo_url?: string;
};

export type DashboardActivityItem = {
  id: number;
  user_id?: number;
  module?: string;
  action?: string;
  table_name?: string;
  record_id?: number | string;
  status?: 'SUCCESS' | 'FAILED' | string;
  error_message?: string;
  created_at?: string;
  user?: DashboardActivityUser | null;
};

export const dashboardService = {
  getRecentActivity: async (limit = 25) => {
    const response = await apiClient.get<ApiResponse<DashboardActivityItem[]>>(
      buildPortUrl('/dashboard/recent-activity'),
      { params: { limit } },
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to load recent activity');
    }

    return response.data.data ?? [];
  },
};
