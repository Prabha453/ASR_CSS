import { hasPermission } from '../../helpers/permissionHelper';

/**
 * Renders children only when the logged-in user's effective permissions
 * include the required module + action.
 *
 * Effective permissions = group base permissions merged with any
 * individual user-level overrides. Stored in sessionStorage on login.
 *
 * Usage:
 *   <PermissionGuard module="company" action="create">
 *     <Button>Add Company</Button>
 *   </PermissionGuard>
 *
 *   <PermissionGuard module="settings" action="edit" fallback={<span>No access</span>}>
 *     <SettingsForm />
 *   </PermissionGuard>
 *
 * Props:
 *   module    {string}    - permission module key
 *   action    {string}    - 'view' | 'create' | 'edit' | 'delete'
 *   fallback  {ReactNode} - optional node to render when access is denied (default: null)
 */
const PermissionGuard = ({ module, action, children, fallback = null }) =>
  hasPermission(module, action) ? children : fallback;

export default PermissionGuard;
