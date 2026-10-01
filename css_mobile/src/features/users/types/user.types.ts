import { PermissionsMap, UserGroup } from './userGroup.types';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MANAGER'
  | 'STAFF'
  | 'VIEWER'
  | 'CLIENT';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';

export type User = {
  user_id: number;
  user_role?: UserRole;
  user_group_id?: number | null;
  first_name?: string;
  last_name?: string;
  email?: string;
  user_name?: string;
  department?: string | null;
  designation?: string | null;
  whatsapp_no?: string | null;
  user_status?: UserStatus;
  profile_photo_url?: string | null;
  join_date?: string | null;
  last_login_date?: string | null;
  created_date?: string;
  group?: UserGroup | null;
};

export type UserListParams = {
  page?: number;
  limit?: number;
  search?: string;
  user_status?: string;
  user_role?: string;
  order?: string;
};

export type UserListResult = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: User[];
};

export type UserListFilters = {
  search: string;
  status: string;
  role: string;
};

export type UserFormData = {
  first_name: string;
  last_name: string;
  email: string;
  user_name: string;
  user_password: string;
  confirm_password: string;
  user_role: UserRole;
  user_group_id: string;
  user_status: UserStatus;
  department: string;
  designation: string;
};

export type UserPayload = {
  first_name: string;
  last_name: string;
  email: string;
  user_name: string;
  user_role: UserRole;
  user_status: UserStatus;
  user_group_id: number | null;
  department: string | null;
  designation: string | null;
  user_password?: string;
  created_by?: number;
  updated_by?: number;
};

export type UserPermissionData = {
  user_id: number;
  user_group_id?: number | null;
  group_permissions: PermissionsMap;
  user_overrides: PermissionsMap;
  effective_permissions: PermissionsMap;
};
