const httpStatus = require('http-status');

const { Op } = require('sequelize');

const TypeOfFeeDao =
    require('../../dao/masterSettings/TypeOfFeeDao');

const responseHandler =
    require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = [
    'type_of_fee',
    'currency',
    'description',
];

const FILTER_FIELDS = [
    'currency',
    'category_id',
    'plus_minus',
];

class TypeOfFeeService {

    constructor() {

        this.typeOfFeeDao =
            new TypeOfFeeDao();

    }

    async _checkExists(id) {

        return await this.typeOfFeeDao
            .findOneByWhere({
                fee_id: id,
                is_deleted: false,
            });

    }

    create = async (body) => {
        try {

            const existing =
                await this.typeOfFeeDao
                    .findOneByWhere({
                        type_of_fee:
                            body.type_of_fee,
                        currency:
                            body.currency,
                        is_deleted: false,
                    });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Type of fee already exists'
                );

            }

            body.is_deleted = false;

            body.updated_date = new Date();

            const data =
                await this.typeOfFeeDao
                    .create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Type of fee created successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Create type of fee error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error creating type of fee'
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
                    [['fee_id', 'DESC']]
                );

            const result =
                await this.typeOfFeeDao
                    .findAndCountAll({
                        where,
                        limit,
                        offset,
                        order,
                    });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No type of fees found',
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
                'Type of fee list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error(
                'List type of fee error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching type of fee list'
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
                    'Type of fee not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Type of fee fetched successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Get type of fee error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching type of fee'
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
                    'Type of fee not found'
                );

            }

            const exists =
                await this.typeOfFeeDao
                    .findOneByWhere({
                        type_of_fee:
                            body.type_of_fee,
                        currency:
                            body.currency,
                        is_deleted: false,
                        fee_id: {
                            [Op.ne]: id
                        }
                    });

            if (exists) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Type of fee already exists'
                );

            }

            await this.typeOfFeeDao
                .updateWhere(
                    {
                        ...body,
                        updated_date: new Date(),
                    },
                    {
                        fee_id: id
                    }
                );

            const updatedData =
                await this.typeOfFeeDao
                    .findOneByWhere({
                        fee_id: id,
                    });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Type of fee updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error(
                'Update type of fee error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error updating type of fee'
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
                    'Type of fee not found'
                );

            }

            await this.typeOfFeeDao
                .updateWhere(
                    {
                        is_deleted: true,
                        updated_date: new Date(),
                    },
                    {
                        fee_id: id
                    }
                );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Type of fee deleted successfully'
            );

        } catch (err) {

            logger.error(
                'Delete type of fee error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error deleting type of fee'
            );

        }
    };

}

module.exports = TypeOfFeeService;