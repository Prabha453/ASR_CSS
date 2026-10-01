const httpStatus = require('http-status');

const { Op } = require('sequelize');

const CompanySegregationDao =
    require('../../dao/masterSettings/CompanySegregationDao');

const responseHandler =
    require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = [
    'segregation_name'
];

class CompanySegregationService {

    constructor() {

        this.companySegregationDao =
            new CompanySegregationDao();

    }

    async _checkExists(id) {

        return await this.companySegregationDao
            .findOneByWhere({
                segregation_id: id,
                is_deleted: false,
            });

    }

    create = async (body) => {
        try {

            const existing =
                await this.companySegregationDao
                    .findOneByWhere({
                        segregation_name:
                            body.segregation_name,
                        is_deleted: false,
                    });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Company segregation already exists'
                );

            }

            body.is_deleted = false;

            body.updated_date = new Date();

            const data =
                await this.companySegregationDao
                    .create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Company segregation created successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Create company segregation error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error creating company segregation'
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
                    [['segregation_id', 'DESC']]
                );

            const result =
                await this.companySegregationDao
                    .findAndCountAll({
                        where,
                        limit,
                        offset,
                        order,
                    });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No company segregations found',
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
                'Company segregation list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error(
                'List company segregation error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching company segregation list'
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
                    'Company segregation not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Company segregation fetched successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Get company segregation error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching company segregation'
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
                    'Company segregation not found'
                );

            }

            const exists =
                await this.companySegregationDao
                    .findOneByWhere({
                        segregation_name:
                            body.segregation_name,
                        is_deleted: false,
                        segregation_id: {
                            [Op.ne]: id
                        }
                    });

            if (exists) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Company segregation already exists'
                );

            }

            await this.companySegregationDao
                .updateWhere(
                    {
                        ...body,
                        updated_date: new Date(),
                    },
                    {
                        segregation_id: id
                    }
                );

            const updatedData =
                await this.companySegregationDao
                    .findOneByWhere({
                        segregation_id: id,
                    });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Company segregation updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error(
                'Update company segregation error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error updating company segregation'
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
                    'Company segregation not found'
                );

            }

            await this.companySegregationDao
                .updateWhere(
                    {
                        is_deleted: true,
                        updated_date: new Date(),
                    },
                    {
                        segregation_id: id
                    }
                );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Company segregation deleted successfully'
            );

        } catch (err) {

            logger.error(
                'Delete company segregation error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error deleting company segregation'
            );

        }
    };

}

module.exports = CompanySegregationService;