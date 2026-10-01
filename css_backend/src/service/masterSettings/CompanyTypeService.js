const httpStatus = require('http-status');
const { Op } = require('sequelize');

const CompanyTypeDao = require('../../dao/masterSettings/CompanyTypeDao');

const responseHandler = require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = ['company_type_name'];

class CompanyTypeService {

    constructor() {
        this.companyTypeDao = new CompanyTypeDao();
    }

    async _checkExists(id) {

        return await this.companyTypeDao.findOneByWhere({
            company_type_id: id,
            is_deleted: false,
        });

    }

    create = async (body) => {
        try {

            const existing =
                await this.companyTypeDao.findOneByWhere({
                    company_type_name: body.company_type_name,
                    is_deleted: false,
                });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Company type already exists'
                );

            }

            body.is_deleted = false;
            body.updated_date = new Date();

            const data =
                await this.companyTypeDao.create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Company type created successfully',
                data
            );

        } catch (err) {

            logger.error('Create company type error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error creating company type'
            );

        }
    };

    list = async (query) => {
        try {

            const where = buildCompleteWhere({
                query,
                searchFields: SEARCH_FIELDS,
                filterFields: [],
                baseWhere: { is_deleted: false },
            });

            const { page, limit, offset } =
                getPaginationParams(query, 10);

            const order =
                buildOrderClause(
                    query.order,
                    [['company_type_order', 'ASC'], ['company_type_id', 'ASC']]
                );

            const result =
                await this.companyTypeDao.findAndCountAll({
                    where,
                    limit,
                    offset,
                    order,
                });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No company types found',
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
                'Company type list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error('List company type error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching company type list'
            );

        }
    };

    get = async (id) => {
        try {

            const data = await this._checkExists(id);

            if (!data) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Company type not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Company type fetched successfully',
                data
            );

        } catch (err) {

            logger.error('Get company type error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching company type'
            );

        }
    };

    update = async (id, body) => {
        try {

            const oldData = await this._checkExists(id);

            if (!oldData) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Company type not found'
                );

            }

            if (
                body.company_type_name &&
                body.company_type_name !== oldData.company_type_name
            ) {

                const exists =
                    await this.companyTypeDao.findOneByWhere({
                        company_type_name: body.company_type_name,
                        is_deleted: false,
                        company_type_id: {
                            [Op.ne]: id
                        }
                    });

                if (exists) {

                    return responseHandler.returnError(
                        httpStatus.BAD_REQUEST,
                        'Company type already exists'
                    );

                }
            }

            await this.companyTypeDao.updateWhere(
                {
                    ...body,
                    updated_date: new Date(),
                },
                {
                    company_type_id: id
                }
            );

            const updatedData =
                await this.companyTypeDao.findOneByWhere({
                    company_type_id: id,
                });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Company type updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error('Update company type error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error updating company type'
            );

        }
    };

    delete = async (id) => {
        try {

            const oldData = await this._checkExists(id);

            if (!oldData) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Company type not found'
                );

            }

            await this.companyTypeDao.updateWhere(
                {
                    is_deleted: true,
                    updated_date: new Date(),
                },
                {
                    company_type_id: id
                }
            );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Company type deleted successfully'
            );

        } catch (err) {

            logger.error('Delete company type error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error deleting company type'
            );

        }
    };

}

module.exports = CompanyTypeService;