const httpStatus = require('http-status');
const { Op } = require('sequelize');

const ShareClassMasterDao = require('../../dao/masterSettings/ShareClassMasterDao');

const generateUniqueSlug = require('../../helper/generateUniqueSlug');

const responseHandler = require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = ['sc_name', 'sc_slug', 'sc_type'];

const FILTER_FIELDS = ['sc_type'];

class ShareClassMasterService {

    constructor() {
        this.shareClassMasterDao =
            new ShareClassMasterDao();
    }

    async _checkExists(id) {

        return await this.shareClassMasterDao.findOneByWhere({
            sc_id: id,
            is_deleted: false,
        });

    }

    create = async (body) => {
        try {

            const existing =
                await this.shareClassMasterDao.findOneByWhere({
                    sc_name: body.sc_name,
                    is_deleted: false,
                });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Share class already exists'
                );

            }

            body.sc_slug =
                await generateUniqueSlug(
                    this.shareClassMasterDao.Model,
                    body.sc_name,
                    'sc_slug',
                    'sc_id'
                );

            body.is_deleted = false;
            body.updated_date = new Date();

            const data =
                await this.shareClassMasterDao.create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Share class created successfully',
                data
            );

        } catch (err) {

            logger.error('Create share class error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error creating share class'
            );

        }
    };

    list = async (query) => {
        try {

            const where = buildCompleteWhere({
                query,
                searchFields: SEARCH_FIELDS,
                filterFields: FILTER_FIELDS,
                baseWhere: { is_deleted: false },
            });

            const { page, limit, offset } =
                getPaginationParams(query, 10);

            const order =
                buildOrderClause(
                    query.order,
                    [['sc_id', 'DESC']]
                );

            const result =
                await this.shareClassMasterDao.findAndCountAll({
                    where,
                    limit,
                    offset,
                    order,
                });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No share classes found',
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
                'Share class list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error('List share class error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching share class list'
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
                    'Share class not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Share class fetched successfully',
                data
            );

        } catch (err) {

            logger.error('Get share class error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching share class'
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
                    'Share class not found'
                );

            }

            if (
                body.sc_name &&
                body.sc_name !== oldData.sc_name
            ) {

                const exists =
                    await this.shareClassMasterDao.findOneByWhere({
                        sc_name: body.sc_name,
                        is_deleted: false,
                        sc_id: {
                            [Op.ne]: id
                        }
                    });

                if (exists) {

                    return responseHandler.returnError(
                        httpStatus.BAD_REQUEST,
                        'Share class already exists'
                    );

                }

                body.sc_slug =
                    await generateUniqueSlug(
                        this.shareClassMasterDao.Model,
                        body.sc_name,
                        'sc_slug',
                        'sc_id',
                        id
                    );

            }

            await this.shareClassMasterDao.updateWhere(
                {
                    ...body,
                    updated_date: new Date(),
                },
                {
                    sc_id: id
                }
            );

            const updatedData =
                await this.shareClassMasterDao.findOneByWhere({
                    sc_id: id,
                });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Share class updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error('Update share class error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error updating share class'
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
                    'Share class not found'
                );

            }

            await this.shareClassMasterDao.updateWhere(
                {
                    is_deleted: true,
                    updated_date: new Date(),
                },
                {
                    sc_id: id
                }
            );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Share class deleted successfully'
            );

        } catch (err) {

            logger.error('Delete share class error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error deleting share class'
            );

        }
    };

}

module.exports = ShareClassMasterService;