import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { hasPermission } from '../../helpers/permissionHelper';

/**
 * Route-level permission guard.
 * If the user lacks the required permission, shows a toast and redirects to /dashboard.
 *
 * Usage in allRoutes.js:
 *   { path: '/individual/add', component:
 *       <PermissionRoute module="individual" action="create"><Individual /></PermissionRoute> }
 */
const PermissionRoute = ({ module, action, children, redirectTo = '/dashboard' }) => {
  const denied = !hasPermission(module, action);

  useEffect(() => {
    if (denied) {
      toast.error('You do not have permission to access this page.', { toastId: `perm-${module}-${action}` });
    }
  }, [denied, module, action]);

  if (denied) return <Navigate to={redirectTo} replace />;
  return children;
};

export default PermissionRoute;
