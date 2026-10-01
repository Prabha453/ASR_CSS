import { PermissionAction, PermissionsMap } from '../types/userGroup.types';

export const USER_GROUP_PAGE_SIZE = 15;

export type PermissionModule = {
  key: string;
  label: string;
  actions: PermissionAction[];
};

const CRUD: PermissionAction[] = ['view', 'create', 'edit', 'delete'];

export const PERMISSION_MODULES: PermissionModule[] = [
  { key: 'dashboard', label: 'Dashboard', actions: ['view'] },
  { key: 'company', label: 'Company', actions: CRUD },
  { key: 'individual', label: 'Individual', actions: CRUD },
  { key: 'officials', label: 'Officials', actions: CRUD },
  { key: 'users', label: 'Users', actions: CRUD },
  { key: 'user_groups', label: 'User Groups', actions: CRUD },
  { key: 'settings', label: 'Settings', actions: CRUD },
];

export const PERMISSION_ACTION_LABELS: Record<PermissionAction, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
};

export function createEmptyPermissions(): PermissionsMap {
  const map: PermissionsMap = {};
  PERMISSION_MODULES.forEach((module) => {
    map[module.key] = {};
    module.actions.forEach((action) => {
      map[module.key][action] = false;
    });
  });
  return map;
}

export function countPermissions(permissions: PermissionsMap): { granted: number; total: number } {
  let granted = 0;
  let total = 0;
  PERMISSION_MODULES.forEach((module) => {
    module.actions.forEach((action) => {
      total += 1;
      if (permissions?.[module.key]?.[action]) {
        granted += 1;
      }
    });
  });
  return { granted, total };
}
