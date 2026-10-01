const httpStatus = require('http-status');

const { Op } = require('sequelize');

const EntityServiceCategoryDao =
    require('../../dao/masterSettings/EntityServiceCategoryDao');

const responseHandler =
    require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = [
    'service_name',
    'service_description'
];

const FILTER_FIELDS = [];

class EntityServiceCategoryService {

    constructor() {

        this.entityServiceDao =
            new EntityServiceCategoryDao();

    }

    async _checkExists(id) {

        return await this.entityServiceDao
            .findOneByWhere({
                service_id: id,
                is_deleted: false,
            });

    }

    create = async (body) => {
        try {

            const existing =
                await this.entityServiceDao
                    .findOneByWhere({
                        service_name:
                            body.service_name,
                        is_deleted: false,
                    });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Entity service already exists'
                );

            }

            body.is_deleted = false;

            body.updated_date = new Date();

            const data =
                await this.entityServiceDao
                    .create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Entity service created successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Create entity service error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error creating entity service'
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
                        is_deleted: false
                    },
                });

            const { page, limit, offset } =
                getPaginationParams(query, 10);

            const order =
                buildOrderClause(
                    query.order,
                    [['service_id', 'DESC']]
                );

            const result =
                await this.entityServiceDao
                    .findAndCountAll({
                        where,
                        limit,
                        offset,
                        order,
                    });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No entity services found',
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
                'Entity service list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error(
                'List entity service error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching entity service list'
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
                    'Entity service not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Entity service fetched successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Get entity service error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching entity service'
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
                    'Entity service not found'
                );

            }

            const exists =
                await this.entityServiceDao
                    .findOneByWhere({
                        service_name:
                            body.service_name,
                        is_deleted: false,
                        service_id: {
                            [Op.ne]: id
                        }
                    });

            if (exists) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Entity service already exists'
                );

            }

            await this.entityServiceDao
                .updateWhere(
                    {
                        ...body,
                        updated_date: new Date(),
                    },
                    {
                        service_id: id
                    }
                );

            const updatedData =
                await this.entityServiceDao
                    .findOneByWhere({
                        service_id: id,
                    });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Entity service updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error(
                'Update entity service error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error updating entity service'
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
                    'Entity service not found'
                );

            }

            await this.entityServiceDao
                .updateWhere(
                    {
                        is_deleted: true,
                        updated_date: new Date(),
                    },
                    {
                        service_id: id
                    }
                );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Entity service deleted successfully'
            );

        } catch (err) {

            logger.error(
                'Delete entity service error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error deleting entity service'
            );

        }
    };

}

module.exports = EntityServiceCategoryService;