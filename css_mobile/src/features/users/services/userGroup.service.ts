import { apiClient, buildPortUrl } from '@/shared/services/apiClient';
import { ApiResponse, PaginatedResponse } from '@/shared/types';
import { USER_GROUP_PAGE_SIZE } from '../constants/permissions.constants';
import {
  UserGroup,
  UserGroupListParams,
  UserGroupListResult,
  UserGroupPayload,
} from '../types/userGroup.types';

function toListResult(payload: PaginatedResponse<UserGroup> | undefined): UserGroupListResult {
  return {
    totalItems: payload?.totalItems ?? 0,
    totalPages: payload?.totalPages ?? 0,
    currentPage: payload?.currentPage ?? 1,
    data: payload?.data ?? [],
  };
}

async function fetchListPage(params: UserGroupListParams): Promise<UserGroupListResult> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<UserGroup>>>(
    buildPortUrl('/user-group/list'),
    {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? USER_GROUP_PAGE_SIZE,
        order: params.order ?? 'created_date:DESC',
        ...(params.search ? { search: params.search } : {}),
      },
    },
  );

  if (!response.data.status) {
    throw new Error(response.data.message || 'Failed to load user groups');
  }

  return toListResult(response.data.data);
}

export const userGroupService = {
  getList: fetchListPage,

  getAll: async (): Promise<UserGroup[]> => {
    const response = await apiClient.get<ApiResponse<UserGroup[]>>(
      buildPortUrl('/user-group/all'),
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to load user groups');
    }

    return response.data.data ?? [];
  },

  getById: async (userGroupId: number): Promise<UserGroup> => {
    const response = await apiClient.get<ApiResponse<UserGroup>>(
      buildPortUrl(`/user-group/get/${userGroupId}`),
    );

    if (!response.data.status || !response.data.data) {
      throw new Error(response.data.message || 'Failed to load user group');
    }

    return response.data.data;
  },

  create: async (payload: UserGroupPayload): Promise<UserGroup> => {
    const response = await apiClient.post<ApiResponse<UserGroup>>(
      buildPortUrl('/user-group/create'),
      payload,
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to create user group');
    }

    return response.data.data as UserGroup;
  },

  update: async (userGroupId: number, payload: UserGroupPayload): Promise<UserGroup> => {
    const response = await apiClient.put<ApiResponse<UserGroup>>(
      buildPortUrl(`/user-group/update/${userGroupId}`),
      payload,
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to update user group');
    }

    return response.data.data as UserGroup;
  },

  delete: async (userGroupId: number): Promise<void> => {
    const response = await apiClient.post<ApiResponse<unknown>>(
      buildPortUrl('/user-group/delete'),
      { user_group_id: userGroupId },
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to delete user group');
    }
  },
};
