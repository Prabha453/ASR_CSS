'use strict';

const httpStatus = require('http-status');
const UserPermissionDao = require('../dao/UserPermissionDao');
const UserGroupDao = require('../dao/UserGroupDao');
const UserDao = require('../dao/UserDao');
const responseHandler = require('../helper/responseHandler');
const logger = require('../config/logger');

class UserPermissionService {

    constructor() {
        this.dao = new UserPermissionDao();
        this.userGroupDao = new UserGroupDao();
        this.userDao = new UserDao();
    }

    /*
    |==========================================================================
    | STATIC: Merge group permissions with sparse user overrides
    |
    | Rules:
    |  - Start with the group's full permission map
    |  - For every module.action present in userOverrides, replace the value
    |  - Absent keys in userOverrides = inherit from group
    |  - If group has no permissions at all (no group) → start from empty map
    |==========================================================================
    */
    static getEffectivePermissions(groupPerms, userOverrides) {
        const base = groupPerms
            ? (typeof groupPerms === 'string' ? JSON.parse(groupPerms) : groupPerms)
            : {};

        const overrides = userOverrides
            ? (typeof userOverrides === 'string' ? JSON.parse(userOverrides) : userOverrides)
            : {};

        const effective = JSON.parse(JSON.stringify(base)); // deep clone

        Object.keys(overrides).forEach((mod) => {
            if (!effective[mod]) effective[mod] = {};
            Object.keys(overrides[mod]).forEach((action) => {
                effective[mod][action] = overrides[mod][action];
            });
        });

        return effective;
    }

    /*
    |==========================================================================
    | GET permission record for a user (with group + effective merged)
    |==========================================================================
    */
    getByUser = async (user_id) => {
        try {
            const user = await this.userDao.findOneByWhere({ user_id, is_deleted: 0 });
            if (!user) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'User not found');
            }

            let groupPerms = {};
            if (user.user_group_id) {
                const group = await this.userGroupDao.findOneByWhere({
                    user_group_id: user.user_group_id,
                    is_deleted: 0,
                });
                if (group) {
                    groupPerms = typeof group.permissions_json === 'string'
                        ? JSON.parse(group.permissions_json)
                        : (group.permissions_json || {});
                }
            }

            const permRecord = await this.dao.findOneByWhere({ user_id, is_deleted: 0 });
            const rawOverrides = permRecord ? permRecord.permissions_json : {};
            const userOverrides = typeof rawOverrides === 'string'
                ? (() => { try { return JSON.parse(rawOverrides); } catch { return {}; } })()
                : (rawOverrides || {});

            const effective = UserPermissionService.getEffectivePermissions(groupPerms, userOverrides);

            return responseHandler.returnSuccess(httpStatus.OK, 'Permissions fetched', {
                user_id,
                user_group_id: user.user_group_id || null,
                group_permissions: groupPerms,
                user_overrides: userOverrides,
                effective_permissions: effective,
            });
        } catch (err) {
            logger.error('Get user permission error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching permissions');
        }
    };

    /*
    |==========================================================================
    | UPSERT — save user overrides (create or replace)
    |==========================================================================
    */
    upsert = async (user_id, permissions_json, updated_by = null) => {
        try {
            const user = await this.userDao.findOneByWhere({ user_id, is_deleted: 0 });
            if (!user) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'User not found');
            }

            const existing = await this.dao.findOneByWhere({ user_id, is_deleted: 0 });

            const overridesObj = typeof permissions_json === 'string'
                ? (() => { try { return JSON.parse(permissions_json); } catch { return {}; } })()
                : (permissions_json || {});

            if (existing) {
                await this.dao.updateWhere(
                    { permissions_json: JSON.stringify(overridesObj), updated_date: new Date(), updated_by },
                    { user_id, is_deleted: 0 }
                );
            } else {
                await this.dao.create({
                    user_id,
                    permissions_json: overridesObj,
                    is_deleted: 0,
                    created_by: updated_by,
                    created_date: new Date(),
                    updated_date: new Date(),
                });
            }

            return await this.getByUser(user_id);
        } catch (err) {
            logger.error('Upsert user permission error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, 'Error saving permissions');
        }
    };

    /*
    |==========================================================================
    | CLEAR — remove all user-level overrides (revert to group)
    |==========================================================================
    */
    clear = async (user_id) => {
        try {
            await this.dao.updateWhere(
                { permissions_json: null, updated_date: new Date() },
                { user_id, is_deleted: 0 }
            );
            return responseHandler.returnSuccess(httpStatus.OK, 'User overrides cleared');
        } catch (err) {
            logger.error('Clear user permission error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, 'Error clearing permissions');
        }
    };

}

module.exports = UserPermissionService;
