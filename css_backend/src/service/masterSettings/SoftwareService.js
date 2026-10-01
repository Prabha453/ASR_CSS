const httpStatus = require('http-status');

const { Op } = require('sequelize');

const SoftwareDao =
    require('../../dao/masterSettings/SoftwareDao');

const responseHandler =
    require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = [
    'software_name'
];

const FILTER_FIELDS = [];

class SoftwareService {

    constructor() {

        this.softwareDao =
            new SoftwareDao();

    }

    async _checkExists(id) {

        return await this.softwareDao
            .findOneByWhere({
                software_id: id,
                is_deleted: false,
            });

    }

    create = async (body) => {
        try {

            const existing =
                await this.softwareDao
                    .findOneByWhere({
                        software_name:
                            body.software_name,
                        is_deleted: false,
                    });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Software already exists'
                );

            }

            body.is_deleted = false;

            body.updated_date = new Date();

            const data =
                await this.softwareDao
                    .create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Software created successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Create software error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error creating software'
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
                    [['software_id', 'DESC']]
                );

            const result =
                await this.softwareDao
                    .findAndCountAll({
                        where,
                        limit,
                        offset,
                        order,
                    });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No softwares found',
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
                'Software list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error(
                'List software error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching software list'
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
                    'Software not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Software fetched successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Get software error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching software'
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
                    'Software not found'
                );

            }

            const exists =
                await this.softwareDao
                    .findOneByWhere({
                        software_name:
                            body.software_name,
                        is_deleted: false,
                        software_id: {
                            [Op.ne]: id
                        }
                    });

            if (exists) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Software already exists'
                );

            }

            await this.softwareDao
                .updateWhere(
                    {
                        ...body,
                        updated_date: new Date(),
                    },
                    {
                        software_id: id
                    }
                );

            const updatedData =
                await this.softwareDao
                    .findOneByWhere({
                        software_id: id,
                    });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Software updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error(
                'Update software error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error updating software'
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
                    'Software not found'
                );

            }

            await this.softwareDao
                .updateWhere(
                    {
                        is_deleted: true,
                        updated_date: new Date(),
                    },
                    {
                        software_id: id
                    }
                );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Software deleted successfully'
            );

        } catch (err) {

            logger.error(
                'Delete software error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error deleting software'
            );

        }
    };

}

module.exports = SoftwareService;