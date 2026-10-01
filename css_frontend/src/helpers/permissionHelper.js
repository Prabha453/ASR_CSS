import { getLoggedinUser } from './api_helper';

/**
 * All modules + their available actions.
 * Single source of truth used by the permission matrix UI and all guards.
 */
export const PERMISSION_MODULES = [
  { key: 'dashboard',   label: 'Dashboard',    actions: ['view'] },
  { key: 'company',     label: 'Company',      actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'individual',  label: 'Individual',   actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'officials',   label: 'Officials',    actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'users',       label: 'Users',        actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'user_groups', label: 'User Groups',  actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'settings',    label: 'Settings',     actions: ['view', 'create', 'edit', 'delete'] },
];

export const ALL_ACTIONS = ['view', 'create', 'edit', 'delete'];

export const ACTION_LABELS = {
  view:   'View',
  create: 'Create',
  edit:   'Edit',
  delete: 'Delete',
};

/**
 * Merge group base permissions with sparse user-level overrides.
 * - userOverrides keys win over groupPerms for the same module.action
 * - Keys absent in userOverrides are inherited from groupPerms
 *
 * @param {Object} groupPerms   - full group permission map
 * @param {Object} userOverrides - sparse user override map (only changed keys)
 * @returns {Object} effective permissions
 */
export const getEffectivePermissions = (groupPerms = {}, userOverrides = {}) => {
  const effective = JSON.parse(JSON.stringify(groupPerms));
  Object.keys(userOverrides).forEach((mod) => {
    if (!effective[mod]) effective[mod] = {};
    Object.keys(userOverrides[mod]).forEach((action) => {
      effective[mod][action] = userOverrides[mod][action];
    });
  });
  return effective;
};

/**
 * Build an empty full permission map (all false) for every known module.
 */
export const buildEmptyPermissions = () =>
  PERMISSION_MODULES.reduce((acc, mod) => {
    acc[mod.key] = mod.actions.reduce((a, act) => { a[act] = false; return a; }, {});
    return acc;
  }, {});

/**
 * Check if the currently logged-in user has a specific permission.
 * Uses session-stored effective permissions.
 *
 * @param {string} module
 * @param {string} action
 * @returns {boolean}
 */
export const hasPermission = (module, action) => {
  const user = getLoggedinUser();
  return user?.permissions?.[module]?.[action] === true;
};

/**
 * Count total granted permissions in a permission map.
 */
export const countGranted = (perms = {}) =>
  Object.values(perms).reduce(
    (total, actions) => total + Object.values(actions).filter(Boolean).length,
    0
  );

/**
 * Classify each cell relative to group base:
 * - 'inherited'  → not in overrides, value comes from group
 * - 'granted'    → override = true  (may differ from group)
 * - 'revoked'    → override = false (explicitly removed)
 *
 * Returns { [module]: { [action]: 'inherited'|'granted'|'revoked' } }
 */
export const classifyOverrides = (groupPerms = {}, userOverrides = {}) => {
  const result = {};
  PERMISSION_MODULES.forEach(({ key: mod, actions }) => {
    result[mod] = {};
    actions.forEach((action) => {
      if (userOverrides[mod] && Object.prototype.hasOwnProperty.call(userOverrides[mod], action)) {
        result[mod][action] = userOverrides[mod][action] ? 'granted' : 'revoked';
      } else {
        result[mod][action] = 'inherited';
      }
    });
  });
  return result;
};
