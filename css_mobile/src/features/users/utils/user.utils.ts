import { USER_AVATAR_COLORS } from '../constants/user.constants';
import { User, UserFormData, UserPayload } from '../types/user.types';
import { PermissionsMap, UserGroup, UserGroupFormData, UserGroupPayload } from '../types/userGroup.types';
import { createEmptyPermissions } from '../constants/permissions.constants';

export function getUserFullName(user: Pick<User, 'first_name' | 'last_name'>): string {
  return [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || '—';
}

export function getUserInitials(user: Pick<User, 'first_name' | 'last_name'>): string {
  const initials = [user.first_name, user.last_name]
    .filter(Boolean)
    .map((part) => part?.[0] ?? '')
    .join('')
    .toUpperCase();
  return initials || 'U';
}

export function getUserAvatarColor(seed = ''): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % USER_AVATAR_COLORS.length;
  return USER_AVATAR_COLORS[index];
}

export const EMPTY_USER_FORM: UserFormData = {
  first_name: '',
  last_name: '',
  email: '',
  user_name: '',
  user_password: '',
  confirm_password: '',
  user_role: 'STAFF',
  user_group_id: '',
  user_status: 'ACTIVE',
  department: '',
  designation: '',
};

export function mapUserToForm(user: User): UserFormData {
  return {
    first_name: user.first_name ?? '',
    last_name: user.last_name ?? '',
    email: user.email ?? '',
    user_name: user.user_name ?? '',
    user_password: '',
    confirm_password: '',
    user_role: user.user_role ?? 'STAFF',
    user_group_id: user.user_group_id ? String(user.user_group_id) : '',
    user_status: user.user_status ?? 'ACTIVE',
    department: user.department ?? '',
    designation: user.designation ?? '',
  };
}

export function buildUserPayload(form: UserFormData, userId?: number, isEdit = false): UserPayload {
  const payload: UserPayload = {
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    email: form.email.trim(),
    user_name: form.user_name.trim(),
    user_role: form.user_role,
    user_status: form.user_status,
    user_group_id: form.user_group_id ? Number(form.user_group_id) : null,
    department: form.department.trim() || null,
    designation: form.designation.trim() || null,
  };

  if (form.user_password.trim()) {
    payload.user_password = form.user_password;
  }

  if (userId) {
    if (isEdit) {
      payload.updated_by = userId;
    } else {
      payload.created_by = userId;
      payload.updated_by = userId;
    }
  }

  return payload;
}

export function parsePermissions(raw: UserGroup['permissions_json']): PermissionsMap {
  const base = createEmptyPermissions();
  if (!raw) return base;

  let parsed: PermissionsMap = {};
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw) as PermissionsMap;
    } catch {
      return base;
    }
  } else {
    parsed = raw;
  }

  Object.keys(base).forEach((module) => {
    Object.keys(base[module]).forEach((action) => {
      base[module][action as keyof (typeof base)[string]] = Boolean(
        parsed?.[module]?.[action as keyof PermissionsMap[string]],
      );
    });
  });

  return base;
}

export const EMPTY_GROUP_FORM = (): UserGroupFormData => ({
  group_name: '',
  group_description: '',
  permissions: createEmptyPermissions(),
});

export function mapGroupToForm(group: UserGroup): UserGroupFormData {
  return {
    group_name: group.group_name ?? '',
    group_description: group.group_description ?? '',
    permissions: parsePermissions(group.permissions_json),
  };
}

export function buildGroupPayload(
  form: UserGroupFormData,
  userId?: number,
  isEdit = false,
): UserGroupPayload {
  return {
    group_name: form.group_name.trim(),
    group_description: form.group_description.trim() || null,
    permissions_json: form.permissions,
    ...(userId
      ? isEdit
        ? { updated_by: userId }
        : { created_by: userId, updated_by: userId }
      : {}),
  };
}
