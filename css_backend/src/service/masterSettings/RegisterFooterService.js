const httpStatus = require('http-status');

const { Op } = require('sequelize');

const RegisterFooterDao =
    require('../../dao/masterSettings/RegisterFooterDao');

const responseHandler =
    require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = [
    're_type',
    're_text',
];

const FILTER_FIELDS = [
    're_type',
];

class RegisterFooterService {

    constructor() {

        this.registerFooterDao =
            new RegisterFooterDao();

    }

    async _checkExists(id) {

        return await this.registerFooterDao
            .findOneByWhere({
                rf_id: id,
            });

    }

    create = async (body) => {
        try {

            const existing =
                await this.registerFooterDao
                    .findOneByWhere({
                        re_type: body.re_type,
                        re_text: body.re_text,
                    });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Register footer already exists'
                );

            }

            const data =
                await this.registerFooterDao
                    .create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Register footer created successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Create register footer error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error creating register footer'
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
                    baseWhere: {},
                });

            const { page, limit, offset } =
                getPaginationParams(query, 10);

            const order =
                buildOrderClause(
                    query.order,
                    [['rf_id', 'DESC']]
                );

            const result =
                await this.registerFooterDao
                    .findAndCountAll({
                        where,
                        limit,
                        offset,
                        order,
                    });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No register footers found',
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
                'Register footer list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error(
                'List register footer error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching register footer list'
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
                    'Register footer not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Register footer fetched successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Get register footer error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching register footer'
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
                    'Register footer not found'
                );

            }

            const exists =
                await this.registerFooterDao
                    .findOneByWhere({
                        re_type: body.re_type,
                        re_text: body.re_text,
                        rf_id: {
                            [Op.ne]: id
                        }
                    });

            if (exists) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Register footer already exists'
                );

            }

            await this.registerFooterDao
                .updateWhere(
                    body,
                    {
                        rf_id: id
                    }
                );

            const updatedData =
                await this.registerFooterDao
                    .findOneByWhere({
                        rf_id: id,
                    });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Register footer updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error(
                'Update register footer error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error updating register footer'
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
                    'Register footer not found'
                );

            }

            await this.registerFooterDao
                .destroyWhere({
                    rf_id: id
                });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Register footer deleted successfully'
            );

        } catch (err) {

            logger.error(
                'Delete register footer error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error deleting register footer'
            );

        }
    };

}

module.exports = RegisterFooterService;