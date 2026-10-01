const httpStatus = require('http-status');

const { Op } = require('sequelize');

const CssStatusDao =
    require('../../dao/masterSettings/CssStatusDao');

const responseHandler =
    require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = [
    'css_status_name',
    'css_status_color'
];

class CssStatusService {

    constructor() {

        this.cssStatusDao =
            new CssStatusDao();

    }

    async _checkExists(id) {

        return await this.cssStatusDao
            .findOneByWhere({
                css_status_id: id,
                is_deleted: false,
            });

    }

    create = async (body) => {
        try {

            const existing =
                await this.cssStatusDao
                    .findOneByWhere({
                        css_status_name:
                            body.css_status_name,
                        is_deleted: false,
                    });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'CSS status already exists'
                );

            }

            body.is_deleted = false;

            body.updated_date = new Date();

            const data =
                await this.cssStatusDao
                    .create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'CSS status created successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Create CSS status error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error creating CSS status'
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
                    [['css_status_id', 'DESC']]
                );

            const result =
                await this.cssStatusDao
                    .findAndCountAll({
                        where,
                        limit,
                        offset,
                        order,
                    });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No CSS statuses found',
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
                'CSS status list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error(
                'List CSS status error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching CSS status list'
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
                    'CSS status not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'CSS status fetched successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Get CSS status error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching CSS status'
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
                    'CSS status not found'
                );

            }

            const exists =
                await this.cssStatusDao
                    .findOneByWhere({
                        css_status_name:
                            body.css_status_name,
                        is_deleted: false,
                        css_status_id: {
                            [Op.ne]: id
                        }
                    });

            if (exists) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'CSS status already exists'
                );

            }

            await this.cssStatusDao
                .updateWhere(
                    {
                        ...body,
                        updated_date: new Date(),
                    },
                    {
                        css_status_id: id
                    }
                );

            const updatedData =
                await this.cssStatusDao
                    .findOneByWhere({
                        css_status_id: id,
                    });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'CSS status updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error(
                'Update CSS status error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error updating CSS status'
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
                    'CSS status not found'
                );

            }

            await this.cssStatusDao
                .updateWhere(
                    {
                        is_deleted: true,
                        updated_date: new Date(),
                    },
                    {
                        css_status_id: id
                    }
                );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'CSS status deleted successfully'
            );

        } catch (err) {

            logger.error(
                'Delete CSS status error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error deleting CSS status'
            );

        }
    };

}

module.exports = CssStatusService;