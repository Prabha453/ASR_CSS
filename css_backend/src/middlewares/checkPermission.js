'use strict';

const httpStatus = require('http-status');
const UserGroupDao = require('../dao/UserGroupDao');
const UserPermissionDao = require('../dao/UserPermissionDao');
const UserPermissionService = require('../service/UserPermissionService');
const ApiError = require('../helper/ApiError');

/**
 * Route-level permission guard middleware.
 * Must be used AFTER auth() middleware (which sets req.user).
 *
 * Usage:
 *   router.post('/create', auth(), checkPermission('company', 'create'), controller.create);
 *
 * @param {string} module   - e.g. 'company', 'individual', 'user_groups'
 * @param {string} action   - 'view' | 'create' | 'edit' | 'delete'
 */
const checkPermission = (module, action) => {
    return async (req, res, next) => {
        try {
            const user = req.user;

            if (!user) {
                return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
            }

            /* ── 1. Fetch group permissions ─────────────────────────────── */
            let groupPerms = {};
            if (user.user_group_id) {
                const groupDao = new UserGroupDao();
                const group = await groupDao.findOneByWhere({
                    user_group_id: user.user_group_id,
                    is_deleted: 0,
                });
                if (group) {
                    groupPerms = typeof group.permissions_json === 'string'
                        ? JSON.parse(group.permissions_json)
                        : (group.permissions_json || {});
                }
            }

            /* ── 2. Fetch user-level overrides ──────────────────────────── */
            const permDao = new UserPermissionDao();
            const permRecord = await permDao.findOneByWhere({ user_id: user.user_id, is_deleted: 0 });
            const userOverrides = permRecord ? permRecord.permissions_json : {};

            /* ── 3. Compute effective permissions ───────────────────────── */
            const effective = UserPermissionService.getEffectivePermissions(groupPerms, userOverrides);

            /* ── 4. Check ───────────────────────────────────────────────── */
            const allowed = effective[module]?.[action] === true;

            if (!allowed) {
                return next(
                    new ApiError(
                        httpStatus.FORBIDDEN,
                        `Access denied: you need '${action}' permission on '${module}'`
                    )
                );
            }

            /* Attach effective permissions to request for downstream use */
            req.effectivePermissions = effective;

            return next();
        } catch (err) {
            return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Permission check failed'));
        }
    };
};

module.exports = checkPermission;
