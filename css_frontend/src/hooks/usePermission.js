import { hasPermission } from '../helpers/permissionHelper';

/**
 * Returns true if the logged-in user's effective permissions include module.action.
 *
 * Effective = group permissions merged with any individual user overrides
 * (stored in sessionStorage on login).
 *
 * @param {string} module  - e.g. 'company', 'individual', 'user_groups'
 * @param {string} action  - 'view' | 'create' | 'edit' | 'delete'
 * @returns {boolean}
 */
const usePermission = (module, action) => hasPermission(module, action);

export default usePermission;
