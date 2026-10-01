const httpStatus = require('http-status');

const { Op } = require('sequelize');

const RelatedIndustryDao =
    require('../../dao/masterSettings/RelatedIndustryDao');

const responseHandler =
    require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = [
    'related_industry_name'
];

const FILTER_FIELDS = [];

class RelatedIndustryService {

    constructor() {

        this.relatedIndustryDao =
            new RelatedIndustryDao();

    }

    async _checkExists(id) {

        return await this.relatedIndustryDao
            .findOneByWhere({
                related_industry_id: id,
                is_deleted: false,
            });

    }

    create = async (body) => {
        try {

            const existing =
                await this.relatedIndustryDao
                    .findOneByWhere({
                        related_industry_name:
                            body.related_industry_name,
                        is_deleted: false,
                    });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Related industry already exists'
                );

            }

            body.is_deleted = false;

            body.updated_date = new Date();

            const data =
                await this.relatedIndustryDao
                    .create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Related industry created successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Create related industry error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error creating related industry'
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
                    [['related_industry_id', 'DESC']]
                );

            const result =
                await this.relatedIndustryDao
                    .findAndCountAll({
                        where,
                        limit,
                        offset,
                        order,
                    });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No related industries found',
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
                'Related industry list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error(
                'List related industry error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching related industry list'
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
                    'Related industry not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Related industry fetched successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Get related industry error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching related industry'
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
                    'Related industry not found'
                );

            }

            const exists =
                await this.relatedIndustryDao
                    .findOneByWhere({
                        related_industry_name:
                            body.related_industry_name,
                        is_deleted: false,
                        related_industry_id: {
                            [Op.ne]: id
                        }
                    });

            if (exists) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Related industry already exists'
                );

            }

            await this.relatedIndustryDao
                .updateWhere(
                    {
                        ...body,
                        updated_date: new Date(),
                    },
                    {
                        related_industry_id: id
                    }
                );

            const updatedData =
                await this.relatedIndustryDao
                    .findOneByWhere({
                        related_industry_id: id,
                    });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Related industry updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error(
                'Update related industry error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error updating related industry'
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
                    'Related industry not found'
                );

            }

            await this.relatedIndustryDao
                .updateWhere(
                    {
                        is_deleted: true,
                        updated_date: new Date(),
                    },
                    {
                        related_industry_id: id
                    }
                );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Related industry deleted successfully'
            );

        } catch (err) {

            logger.error(
                'Delete related industry error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error deleting related industry'
            );

        }
    };

}

module.exports = RelatedIndustryService;