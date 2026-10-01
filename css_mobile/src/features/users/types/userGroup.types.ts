export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export type PermissionsMap = Record<string, Partial<Record<PermissionAction, boolean>>>;

export type UserGroup = {
  user_group_id: number;
  group_name?: string;
  group_description?: string | null;
  permissions_json?: PermissionsMap | string | null;
  created_date?: string;
};

export type UserGroupListParams = {
  page?: number;
  limit?: number;
  search?: string;
  order?: string;
};

export type UserGroupListResult = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: UserGroup[];
};

export type UserGroupListFilters = {
  search: string;
};

export type UserGroupFormData = {
  group_name: string;
  group_description: string;
  permissions: PermissionsMap;
};

export type UserGroupPayload = {
  group_name: string;
  group_description: string | null;
  permissions_json: PermissionsMap;
  created_by?: number;
  updated_by?: number;
};
