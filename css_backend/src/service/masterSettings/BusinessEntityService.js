const httpStatus = require('http-status');

const { Op } = require('sequelize');

const BusinessEntityDao =
    require('../../dao/masterSettings/BusinessEntityDao');

const responseHandler =
    require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = [
    'bs_name'
];

class BusinessEntityService {

    constructor() {

        this.businessEntityDao =
            new BusinessEntityDao();

    }

    async _checkExists(id) {

        return await this.businessEntityDao
            .findOneByWhere({
                bn_id: id,
                is_deleted: false,
            });

    }

    create = async (body) => {
        try {

            const existing =
                await this.businessEntityDao
                    .findOneByWhere({
                        bs_name: body.bs_name,
                        is_deleted: false,
                    });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Business entity already exists'
                );

            }

            body.is_deleted = false;

            body.updated_date = new Date();

            const data =
                await this.businessEntityDao
                    .create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Business entity created successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Create business entity error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error creating business entity'
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
                        is_deleted: false
                    },
                });

            const { page, limit, offset } =
                getPaginationParams(query, 10);

            const order =
                buildOrderClause(
                    query.order,
                    [['bn_id', 'DESC']]
                );

            const result =
                await this.businessEntityDao
                    .findAndCountAll({
                        where,
                        limit,
                        offset,
                        order,
                    });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No business entities found',
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
                'Business entity list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error(
                'List business entity error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching business entity list'
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
                    'Business entity not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Business entity fetched successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Get business entity error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching business entity'
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
                    'Business entity not found'
                );

            }

            const exists =
                await this.businessEntityDao
                    .findOneByWhere({
                        bs_name: body.bs_name,
                        is_deleted: false,
                        bn_id: {
                            [Op.ne]: id
                        }
                    });

            if (exists) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Business entity already exists'
                );

            }

            await this.businessEntityDao
                .updateWhere(
                    {
                        ...body,
                        updated_date: new Date(),
                    },
                    {
                        bn_id: id
                    }
                );

            const updatedData =
                await this.businessEntityDao
                    .findOneByWhere({
                        bn_id: id,
                    });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Business entity updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error(
                'Update business entity error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error updating business entity'
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
                    'Business entity not found'
                );

            }

            await this.businessEntityDao
                .updateWhere(
                    {
                        is_deleted: true,
                        updated_date: new Date(),
                    },
                    {
                        bn_id: id
                    }
                );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Business entity deleted successfully'
            );

        } catch (err) {

            logger.error(
                'Delete business entity error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error deleting business entity'
            );

        }
    };

}

module.exports = BusinessEntityService;