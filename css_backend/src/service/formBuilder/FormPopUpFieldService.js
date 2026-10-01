'use strict';

const httpStatus = require('http-status');
const { Op } = require('sequelize');

const FormPopUpFieldDao = require('../../dao/formBuilder/FormPopUpFieldDao');

const responseHandler = require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = [
    'form_pop_up_field_name',
    'form_pop_up_field_slug',
];

class FormPopUpFieldService {

    constructor() {
        this.formPopUpFieldDao = new FormPopUpFieldDao();
    }

    async _checkExists(id) {

        return await this.formPopUpFieldDao.findOneByWhere({
            form_pop_up_field_id: id,
            is_deleted: 0,
        });

    }

    create = async (body) => {
        try {

            const existing =
                await this.formPopUpFieldDao.findOneByWhere({
                    form_pop_up_field_name:
                        body.form_pop_up_field_name,
                    is_deleted: 0,
                });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Form popup field already exists'
                );

            }

            body.is_deleted = 0;
            body.updated_date = new Date();

            const data =
                await this.formPopUpFieldDao.create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Form popup field created successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Create form popup field error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error creating form popup field'
            );

        }
    };

    list = async (query) => {
        try {

            const where = buildCompleteWhere({
                query,
                searchFields: SEARCH_FIELDS,
                filterFields: [],
                baseWhere: {
                    is_deleted: 0,
                },
            });

            const { page, limit, offset } =
                getPaginationParams(query, 10);

            const order =
                buildOrderClause(
                    query.order,
                    [['form_pop_up_field_id', 'DESC']]
                );

            const result =
                await this.formPopUpFieldDao.findAndCountAll({
                    where,
                    limit,
                    offset,
                    order,
                });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No form popup fields found',
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
                'Form popup field list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error(
                'List form popup field error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching form popup field list'
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
                    'Form popup field not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Form popup field fetched successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Get form popup field error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching form popup field'
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
                    'Form popup field not found'
                );

            }

            if (
                body.form_pop_up_field_name &&
                body.form_pop_up_field_name !==
                oldData.form_pop_up_field_name
            ) {

                const exists =
                    await this.formPopUpFieldDao.findOneByWhere({
                        form_pop_up_field_name:
                            body.form_pop_up_field_name,
                        is_deleted: 0,
                        form_pop_up_field_id: {
                            [Op.ne]: id,
                        },
                    });

                if (exists) {

                    return responseHandler.returnError(
                        httpStatus.BAD_REQUEST,
                        'Form popup field already exists'
                    );

                }

            }

            await this.formPopUpFieldDao.updateWhere(
                {
                    ...body,
                    updated_date: new Date(),
                },
                {
                    form_pop_up_field_id: id,
                }
            );

            const updatedData =
                await this.formPopUpFieldDao.findOneByWhere({
                    form_pop_up_field_id: id,
                });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Form popup field updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error(
                'Update form popup field error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error updating form popup field'
            );

        }
    };

    delete = async (id, updatedBy = null) => {
        try {

            const oldData =
                await this._checkExists(id);

            if (!oldData) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Form popup field not found'
                );

            }

            await this.formPopUpFieldDao.updateWhere(
                {
                    is_deleted: 1,
                    updated_date: new Date(),
                    updated_by: updatedBy,
                },
                {
                    form_pop_up_field_id: id,
                }
            );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Form popup field deleted successfully'
            );

        } catch (err) {

            logger.error(
                'Delete form popup field error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error deleting form popup field'
            );

        }
    };

}

module.exports = FormPopUpFieldService;