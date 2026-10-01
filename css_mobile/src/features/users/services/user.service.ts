import { apiClient, buildPortUrl } from '@/shared/services/apiClient';
import { ApiResponse, PaginatedResponse } from '@/shared/types';
import { USER_PAGE_SIZE } from '../constants/user.constants';
import {
  User,
  UserListParams,
  UserListResult,
  UserPayload,
  UserPermissionData,
} from '../types/user.types';
import { PermissionsMap } from '../types/userGroup.types';

function toListResult(payload: PaginatedResponse<User> | undefined): UserListResult {
  return {
    totalItems: payload?.totalItems ?? 0,
    totalPages: payload?.totalPages ?? 0,
    currentPage: payload?.currentPage ?? 1,
    data: payload?.data ?? [],
  };
}

async function fetchListPage(params: UserListParams): Promise<UserListResult> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>(
    buildPortUrl('/user/list'),
    {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? USER_PAGE_SIZE,
        order: params.order ?? 'created_date:DESC',
        ...(params.search ? { search: params.search } : {}),
        ...(params.user_status ? { user_status: params.user_status } : {}),
        ...(params.user_role ? { user_role: params.user_role } : {}),
      },
    },
  );

  if (!response.data.status) {
    throw new Error(response.data.message || 'Failed to load users');
  }

  return toListResult(response.data.data);
}

export const userService = {
  getList: fetchListPage,

  getById: async (userId: number): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(buildPortUrl(`/user/get/${userId}`));

    if (!response.data.status || !response.data.data) {
      throw new Error(response.data.message || 'Failed to load user');
    }

    return response.data.data;
  },

  create: async (payload: UserPayload): Promise<User> => {
    const response = await apiClient.post<ApiResponse<User>>(buildPortUrl('/user/create'), payload);

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to create user');
    }

    return response.data.data as User;
  },

  update: async (userId: number, payload: UserPayload): Promise<User> => {
    const response = await apiClient.put<ApiResponse<User>>(
      buildPortUrl(`/user/update/${userId}`),
      payload,
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to update user');
    }

    return response.data.data as User;
  },

  delete: async (userId: number): Promise<void> => {
    const response = await apiClient.post<ApiResponse<unknown>>(buildPortUrl('/user/delete'), {
      user_id: userId,
    });

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to delete user');
    }
  },

  getPermissions: async (userId: number): Promise<UserPermissionData> => {
    const response = await apiClient.get<ApiResponse<UserPermissionData>>(
      buildPortUrl(`/user-permission/${userId}`),
    );

    if (!response.data.status || !response.data.data) {
      throw new Error(response.data.message || 'Failed to load permissions');
    }

    return response.data.data;
  },

  savePermissions: async (userId: number, permissions: PermissionsMap): Promise<void> => {
    const response = await apiClient.put<ApiResponse<unknown>>(
      buildPortUrl(`/user-permission/${userId}`),
      { permissions_json: permissions },
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to save permissions');
    }
  },

  clearPermissions: async (userId: number): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<unknown>>(
      buildPortUrl(`/user-permission/${userId}/clear`),
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to clear overrides');
    }
  },
};
