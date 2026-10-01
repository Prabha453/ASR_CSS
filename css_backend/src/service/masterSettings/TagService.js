const httpStatus = require('http-status');
const { Op } = require('sequelize');

const TagDao = require('../../dao/masterSettings/TagDao');

const responseHandler = require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = ['tag_name', 'tag_color'];

class TagService {

    constructor() {
        this.tagDao = new TagDao();
    }

    async _checkExists(id) {

        return await this.tagDao.findOneByWhere({
            tag_id: id,
            is_deleted: false,
        });

    }

    create = async (body) => {
        try {

            const existing =
                await this.tagDao.findOneByWhere({
                    tag_name: body.tag_name,
                    is_deleted: false,
                });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Tag already exists'
                );

            }

            body.is_deleted = false;
            body.updated_date = new Date();

            const data =
                await this.tagDao.create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Tag created successfully',
                data
            );

        } catch (err) {

            logger.error('Create tag error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error creating tag'
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
                    [['tag_id', 'DESC']]
                );

            const result =
                await this.tagDao.findAndCountAll({
                    where,
                    limit,
                    offset,
                    order,
                });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No tags found',
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
                'Tag list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error('List tag error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching tag list'
            );

        }
    };

    get = async (id) => {
        try {

            const data = await this._checkExists(id);

            if (!data) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Tag not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Tag fetched successfully',
                data
            );

        } catch (err) {

            logger.error('Get tag error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching tag'
            );

        }
    };

    update = async (id, body) => {
        try {

            const oldData = await this._checkExists(id);

            if (!oldData) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Tag not found'
                );

            }

            if (
                body.tag_name &&
                body.tag_name !== oldData.tag_name
            ) {

                const exists =
                    await this.tagDao.findOneByWhere({
                        tag_name: body.tag_name,
                        is_deleted: false,
                        tag_id: {
                            [Op.ne]: id
                        }
                    });

                if (exists) {

                    return responseHandler.returnError(
                        httpStatus.BAD_REQUEST,
                        'Tag already exists'
                    );

                }
            }

            await this.tagDao.updateWhere(
                {
                    ...body,
                    updated_date: new Date(),
                },
                {
                    tag_id: id
                }
            );

            const updatedData =
                await this.tagDao.findOneByWhere({
                    tag_id: id,
                });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Tag updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error('Update tag error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error updating tag'
            );

        }
    };

    delete = async (id) => {
        try {

            const oldData = await this._checkExists(id);

            if (!oldData) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Tag not found'
                );

            }

            await this.tagDao.updateWhere(
                {
                    is_deleted: true,
                    updated_date: new Date(),
                },
                {
                    tag_id: id
                }
            );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Tag deleted successfully'
            );

        } catch (err) {

            logger.error('Delete tag error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error deleting tag'
            );

        }
    };

}

module.exports = TagService;