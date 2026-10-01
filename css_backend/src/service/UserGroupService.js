'use strict';

const httpStatus = require('http-status');
const UserGroupDao = require('../dao/UserGroupDao');
const responseHandler = require('../helper/responseHandler');
const logger = require('../config/logger');
const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../helper/searchHelper');

const SEARCH_FIELDS = ['group_name', 'group_description'];
const FILTER_FIELDS = [];

class UserGroupService {

    constructor() {
        this.userGroupDao = new UserGroupDao();
    }

    /*
    |==========================================================================
    | CREATE
    |==========================================================================
    */
    create = async (body) => {
        try {
            const existing = await this.userGroupDao.findOneByWhere({
                group_name: body.group_name,
                is_deleted: 0,
            });

            if (existing) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'A group with this name already exists'
                );
            }

            const payload = {
                group_name: body.group_name,
                group_description: body.group_description || null,
                permissions_json: body.permissions_json
                    ? JSON.stringify(body.permissions_json)
                    : JSON.stringify({}),
                is_deleted: 0,
                created_by: body.created_by || null,
                created_date: new Date(),
                updated_date: new Date(),
            };

            const row = await this.userGroupDao.create(payload);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'User group created successfully',
                row
            );

        } catch (err) {
            logger.error('Create user group error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                'Error creating user group'
            );
        }
    };

    /*
    |==========================================================================
    | LIST
    |==========================================================================
    */
    list = async (query) => {
        try {
            const where = buildCompleteWhere({
                query,
                searchFields: SEARCH_FIELDS,
                filterFields: FILTER_FIELDS,
                baseWhere: { is_deleted: 0 },
                dateField: 'created_date',
            });

            const { page, limit, offset } = getPaginationParams(query, 10);
            const order = buildOrderClause(query.order, [['created_date', 'DESC']]);

            const result = await this.userGroupDao.findAndCountAll({
                where,
                limit,
                offset,
                order,
            });

            if (result.count === 0) {
                return responseHandler.returnSuccess(httpStatus.OK, 'No user groups found', {
                    totalItems: 0,
                    data: [],
                    totalPages: 0,
                    currentPage: page,
                });
            }

            const paginationData = responseHandler.getPaginationData(result, page, limit);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'User groups fetched successfully',
                paginationData
            );

        } catch (err) {
            logger.error('User group list error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                'Failed to fetch user groups'
            );
        }
    };

    /*
    |==========================================================================
    | GET SINGLE
    |==========================================================================
    */
    get = async (user_group_id) => {
        try {
            const row = await this.userGroupDao.findOneByWhere({ user_group_id, is_deleted: 0 });

            if (!row) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'User group not found');
            }

            return responseHandler.returnSuccess(httpStatus.OK, 'User group fetched successfully', row);

        } catch (err) {
            logger.error('Get user group error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                'Error fetching user group'
            );
        }
    };

    /*
    |==========================================================================
    | UPDATE
    |==========================================================================
    */
    update = async (user_group_id, body) => {
        try {
            const row = await this.userGroupDao.findOneByWhere({ user_group_id, is_deleted: 0 });

            if (!row) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'User group not found');
            }

            if (body.group_name && body.group_name !== row.group_name) {
                const nameExists = await this.userGroupDao.findOneByWhere({
                    group_name: body.group_name,
                    is_deleted: 0,
                });
                if (nameExists) {
                    return responseHandler.returnError(
                        httpStatus.BAD_REQUEST,
                        'A group with this name already exists'
                    );
                }
            }

            const payload = { updated_date: new Date() };

            if (body.group_name !== undefined) payload.group_name = body.group_name;
            if (body.group_description !== undefined) payload.group_description = body.group_description;
            if (body.permissions_json !== undefined) {
                payload.permissions_json = JSON.stringify(body.permissions_json);
            }
            if (body.updated_by !== undefined) payload.updated_by = body.updated_by;

            await this.userGroupDao.updateWhere(payload, { user_group_id });

            const updated = await this.userGroupDao.findOneByWhere({ user_group_id });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'User group updated successfully',
                updated
            );

        } catch (err) {
            logger.error('Update user group error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                'Error updating user group'
            );
        }
    };

    /*
    |==========================================================================
    | DELETE (soft)
    |==========================================================================
    */
    delete = async (user_group_id) => {
        try {
            const row = await this.userGroupDao.findOneByWhere({ user_group_id, is_deleted: 0 });

            if (!row) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'User group not found');
            }

            await this.userGroupDao.updateWhere(
                { is_deleted: 1, updated_date: new Date() },
                { user_group_id }
            );

            return responseHandler.returnSuccess(httpStatus.OK, 'User group deleted successfully');

        } catch (err) {
            logger.error('Delete user group error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                'Error deleting user group'
            );
        }
    };

    /*
    |==========================================================================
    | GET ALL (for dropdowns)
    |==========================================================================
    */
    getAll = async () => {
        try {
            const rows = await this.userGroupDao.findByWhere({ is_deleted: 0 });
            return responseHandler.returnSuccess(httpStatus.OK, 'User groups fetched', rows);
        } catch (err) {
            logger.error('Get all user groups error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                'Error fetching user groups'
            );
        }
    };

}

module.exports = UserGroupService;
