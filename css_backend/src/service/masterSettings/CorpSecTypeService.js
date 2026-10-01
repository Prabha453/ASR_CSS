const httpStatus = require('http-status');

const { Op } = require('sequelize');

const CorpSecTypeDao =
    require('../../dao/masterSettings/CorpSecTypeDao');

const responseHandler =
    require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = [
    'corp_sec_name',
    'files'
];

const FILTER_FIELDS = [
    'corp_sec_parent'
];

class CorpSecTypeService {

    constructor() {

        this.corpSecTypeDao =
            new CorpSecTypeDao();

    }

    async _checkExists(id) {

        return await this.corpSecTypeDao
            .findOneByWhere({
                corp_sec_id: id,
                is_deleted: false,
            });

    }

    create = async (body) => {
        try {

            const existing =
                await this.corpSecTypeDao
                    .findOneByWhere({
                        corp_sec_name:
                            body.corp_sec_name,
                        is_deleted: false,
                    });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Corp sec type already exists'
                );

            }

            body.is_deleted = false;

            body.updated_date = new Date();

            const data =
                await this.corpSecTypeDao
                    .create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Corp sec type created successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Create corp sec type error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error creating corp sec type'
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
                    [['corp_sec_id', 'DESC']]
                );

            const result =
                await this.corpSecTypeDao
                    .findAndCountAll({
                        where,
                        limit,
                        offset,
                        order,
                    });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No corp sec types found',
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
                'Corp sec type list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error(
                'List corp sec type error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching corp sec type list'
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
                    'Corp sec type not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Corp sec type fetched successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Get corp sec type error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching corp sec type'
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
                    'Corp sec type not found'
                );

            }

            const exists =
                await this.corpSecTypeDao
                    .findOneByWhere({
                        corp_sec_name:
                            body.corp_sec_name,
                        is_deleted: false,
                        corp_sec_id: {
                            [Op.ne]: id
                        }
                    });

            if (exists) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Corp sec type already exists'
                );

            }

            await this.corpSecTypeDao
                .updateWhere(
                    {
                        ...body,
                        updated_date: new Date(),
                    },
                    {
                        corp_sec_id: id
                    }
                );

            const updatedData =
                await this.corpSecTypeDao
                    .findOneByWhere({
                        corp_sec_id: id,
                    });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Corp sec type updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error(
                'Update corp sec type error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error updating corp sec type'
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
                    'Corp sec type not found'
                );

            }

            await this.corpSecTypeDao
                .updateWhere(
                    {
                        is_deleted: true,
                        updated_date: new Date(),
                    },
                    {
                        corp_sec_id: id
                    }
                );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Corp sec type deleted successfully'
            );

        } catch (err) {

            logger.error(
                'Delete corp sec type error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error deleting corp sec type'
            );

        }
    };

}

module.exports = CorpSecTypeService;