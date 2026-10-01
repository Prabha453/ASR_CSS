const httpStatus = require('http-status');

const { Op } = require('sequelize');

const GroupMasterDao =
    require('../../dao/masterSettings/GroupMasterDao');

const responseHandler =
    require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = [
    'group_name',
];

class GroupMasterService {

    constructor() {

        this.groupMasterDao =
            new GroupMasterDao();

    }

    async _checkExists(id) {

        return await this.groupMasterDao
            .findOneByWhere({
                group_id: id,
                is_deleted: false,
            });

    }

    create = async (body) => {
        try {

            const existing =
                await this.groupMasterDao
                    .findOneByWhere({
                        group_name: body.group_name,
                        is_deleted: false,
                    });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Group already exists'
                );

            }

            body.is_deleted = false;

            body.updated_date = new Date();

            const data =
                await this.groupMasterDao
                    .create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Group created successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Create group error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error creating group'
            );

        }
    };

    list = async (query) => {
        try {

            const where =
                buildCompleteWhere({
                    query,
                    searchFields: SEARCH_FIELDS,
                    filterFields: [],
                    baseWhere: {
                        is_deleted: false,
                    },
                });

            const { page, limit, offset } =
                getPaginationParams(query, 10);

            const order =
                buildOrderClause(
                    query.order,
                    [['group_id', 'DESC']]
                );

            const result =
                await this.groupMasterDao
                    .findAndCountAll({
                        where,
                        limit,
                        offset,
                        order,
                    });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No groups found',
                    {
                        totalItems: 0,
                        data: [],
                        totalPages: 0,
                        currentPage: page,
                    }
                );

            }

            const paginationData =
                responseHandler.getPaginationData(
                    result,
                    page,
                    limit
                );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Group list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error(
                'List group error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching group list'
            );

        }
    };

    get = async (id) => {
        try {

            const data =
                await this._checkExists(id);

            if (!data) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Group not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Group fetched successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Get group error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching group'
            );

        }
    };

    update = async (id, body) => {
        try {

            const oldData =
                await this._checkExists(id);

            if (!oldData) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Group not found'
                );

            }

            const exists =
                await this.groupMasterDao
                    .findOneByWhere({
                        group_name: body.group_name,
                        is_deleted: false,
                        group_id: {
                            [Op.ne]: id,
                        },
                    });

            if (exists) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Group already exists'
                );

            }

            await this.groupMasterDao
                .updateWhere(
                    {
                        ...body,
                        updated_date: new Date(),
                    },
                    {
                        group_id: id,
                    }
                );

            const updatedData =
                await this.groupMasterDao
                    .findOneByWhere({
                        group_id: id,
                    });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Group updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error(
                'Update group error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error updating group'
            );

        }
    };

    delete = async (id) => {
        try {

            const oldData =
                await this._checkExists(id);

            if (!oldData) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Group not found'
                );

            }

            await this.groupMasterDao
                .updateWhere(
                    {
                        is_deleted: true,
                        updated_date: new Date(),
                    },
                    {
                        group_id: id,
                    }
                );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Group deleted successfully'
            );

        } catch (err) {

            logger.error(
                'Delete group error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error deleting group'
            );

        }
    };

}

module.exports = GroupMasterService;
