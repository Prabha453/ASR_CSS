const httpStatus = require('http-status');

const { Op } = require('sequelize');

const TemplateCategoryDao =
    require('../../dao/masterSettings/TemplateCategoryDao');

const generateUniqueSlug =
    require('../../helper/generateUniqueSlug');

const responseHandler =
    require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = [
    'tc_name',
    'tc_slug'
];

class TemplateCategoryService {

    constructor() {

        this.templateCategoryDao =
            new TemplateCategoryDao();

    }

    async _checkExists(id) {

        return await this.templateCategoryDao
            .findOneByWhere({
                tc_id: id,
                is_deleted: false,
            });

    }

    create = async (body) => {
        try {

            const existing =
                await this.templateCategoryDao
                    .findOneByWhere({
                        tc_name: body.tc_name,
                        is_deleted: false,
                    });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Template category already exists'
                );

            }

            body.tc_slug =
                await generateUniqueSlug(
                    this.templateCategoryDao.Model,
                    body.tc_name,
                    'tc_slug',
                    'tc_id'
                );

            body.is_deleted = false;

            body.updated_date = new Date();

            const data =
                await this.templateCategoryDao
                    .create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Template category created successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Create template category error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error creating template category'
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
                    [['tc_id', 'DESC']]
                );

            const result =
                await this.templateCategoryDao
                    .findAndCountAll({
                        where,
                        limit,
                        offset,
                        order,
                    });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No template categories found',
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
                'Template category list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error(
                'List template category error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching template category list'
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
                    'Template category not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Template category fetched successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Get template category error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching template category'
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
                    'Template category not found'
                );

            }

            if (
                body.tc_name &&
                body.tc_name !== oldData.tc_name
            ) {

                const exists =
                    await this.templateCategoryDao
                        .findOneByWhere({
                            tc_name: body.tc_name,
                            is_deleted: false,
                            tc_id: {
                                [Op.ne]: id
                            }
                        });

                if (exists) {

                    return responseHandler.returnError(
                        httpStatus.BAD_REQUEST,
                        'Template category already exists'
                    );

                }

                body.tc_slug =
                    await generateUniqueSlug(
                        this.templateCategoryDao.Model,
                        body.tc_name,
                        'tc_slug',
                        'tc_id',
                        id
                    );

            }

            await this.templateCategoryDao
                .updateWhere(
                    {
                        ...body,
                        updated_date: new Date(),
                    },
                    {
                        tc_id: id
                    }
                );

            const updatedData =
                await this.templateCategoryDao
                    .findOneByWhere({
                        tc_id: id,
                    });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Template category updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error(
                'Update template category error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error updating template category'
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
                    'Template category not found'
                );

            }

            await this.templateCategoryDao
                .updateWhere(
                    {
                        is_deleted: true,
                        updated_date: new Date(),
                    },
                    {
                        tc_id: id
                    }
                );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Template category deleted successfully'
            );

        } catch (err) {

            logger.error(
                'Delete template category error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error deleting template category'
            );

        }
    };

}

module.exports = TemplateCategoryService;