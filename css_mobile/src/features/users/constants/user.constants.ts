import { SelectOption } from '@/shared/components/formInputs/CustomSelect';
import { UserRole, UserStatus } from '../types/user.types';

export const USER_PAGE_SIZE = 15;

export const USER_AVATAR_COLORS = [
  '#405189',
  '#0ab39c',
  '#f06548',
  '#f7b84b',
  '#299cdb',
  '#6559cc',
  '#e83e8c',
  '#20c997',
];

export const USER_ROLE_OPTIONS: SelectOption[] = [
  { label: 'Super Admin', value: 'SUPER_ADMIN' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Manager', value: 'MANAGER' },
  { label: 'Staff', value: 'STAFF' },
  { label: 'Viewer', value: 'VIEWER' },
  { label: 'Client', value: 'CLIENT' },
];

export const USER_STATUS_OPTIONS: SelectOption[] = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'Pending', value: 'PENDING' },
];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  STAFF: 'Staff',
  VIEWER: 'Viewer',
  CLIENT: 'Client',
};

export const USER_STATUS_META: Record<UserStatus, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Active', color: '#0ab39c', bg: '#EAFBF7' },
  INACTIVE: { label: 'Inactive', color: '#878a99', bg: '#F4F4F4' },
  SUSPENDED: { label: 'Suspended', color: '#f06548', bg: '#FFE8E5' },
  PENDING: { label: 'Pending', color: '#f7b84b', bg: '#FFF4E8' },
};

export const USER_STATUS_FILTERS: SelectOption[] = [
  { label: 'All Status', value: '' },
  ...USER_STATUS_OPTIONS,
];

export const USER_ROLE_FILTERS: SelectOption[] = [
  { label: 'All Roles', value: '' },
  ...USER_ROLE_OPTIONS,
];
