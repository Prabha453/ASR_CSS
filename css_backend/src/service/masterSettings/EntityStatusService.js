'use strict';

const httpStatus = require('http-status');

const { Op } = require('sequelize');

const EntityStatusDao =
    require('../../dao/masterSettings/EntityStatusDao');

const responseHandler =
    require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = [
    'e_status_name'
];

const FILTER_FIELDS = [];

class EntityStatusService {

    constructor() {

        this.entityStatusDao =
            new EntityStatusDao();

    }

    async _checkExists(id) {

        return await this.entityStatusDao
            .findOneByWhere({
                e_status_id: id,
                is_deleted: false,
            });

    }

    create = async (body) => {
        try {

            const existing =
                await this.entityStatusDao
                    .findOneByWhere({
                        e_status_name: body.e_status_name,
                        is_deleted: false,
                    });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Entity status already exists'
                );

            }

            body.is_deleted = false;
            body.updated_date = new Date();

            const data =
                await this.entityStatusDao
                    .create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Entity status created successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Create entity status error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error creating entity status'
            );

        }
    };

    list = async (query) => {
        try {

            const where =
                buildCompleteWhere({
                    query,
                    searchFields: SEARCH_FIELDS,
                    filterFields: FILTER_FIELDS,
                    baseWhere: {
                        is_deleted: false,
                    },
                });

            const { page, limit, offset } =
                getPaginationParams(query, 10);

            const order =
                buildOrderClause(
                    query.order,
                    [['e_status_id', 'DESC']]
                );

            const result =
                await this.entityStatusDao
                    .findAndCountAll({
                        where,
                        limit,
                        offset,
                        order,
                    });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No entity statuses found',
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
                'Entity status list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error(
                'List entity status error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching entity status list'
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
                    'Entity status not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Entity status fetched successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Get entity status error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching entity status'
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
                    'Entity status not found'
                );

            }

            const exists =
                await this.entityStatusDao
                    .findOneByWhere({
                        e_status_name: body.e_status_name,
                        is_deleted: false,
                        e_status_id: {
                            [Op.ne]: id,
                        },
                    });

            if (exists) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Entity status already exists'
                );

            }

            await this.entityStatusDao
                .updateWhere(
                    {
                        ...body,
                        updated_date: new Date(),
                    },
                    {
                        e_status_id: id,
                    }
                );

            const updatedData =
                await this.entityStatusDao
                    .findOneByWhere({
                        e_status_id: id,
                    });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Entity status updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error(
                'Update entity status error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error updating entity status'
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
                    'Entity status not found'
                );

            }

            await this.entityStatusDao
                .updateWhere(
                    {
                        is_deleted: true,
                        updated_date: new Date(),
                    },
                    {
                        e_status_id: id,
                    }
                );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Entity status deleted successfully'
            );

        } catch (err) {

            logger.error(
                'Delete entity status error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error deleting entity status'
            );

        }
    };

}

module.exports = EntityStatusService;