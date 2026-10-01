const httpStatus = require('http-status');
const { Op } = require('sequelize');

const SalutationDao = require('../../dao/masterSettings/SalutationDao');

const responseHandler = require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = ['salutation_name'];

class SalutationService {

    constructor() {
        this.salutationDao = new SalutationDao();
    }

    async _checkExists(id) {

        return await this.salutationDao.findOneByWhere({
            salutation_id: id,
            is_deleted: false,
        });

    }

    create = async (body) => {
        try {

            const existing =
                await this.salutationDao.findOneByWhere({
                    salutation_name: body.salutation_name,
                    is_deleted: false,
                });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Salutation already exists'
                );

            }

            body.is_deleted = false;
            body.updated_date = new Date();

            const data =
                await this.salutationDao.create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Salutation created successfully',
                data
            );

        } catch (err) {

            logger.error('Create salutation error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error creating salutation'
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
                    [['salutation_id', 'DESC']]
                );

            const result =
                await this.salutationDao.findAndCountAll({
                    where,
                    limit,
                    offset,
                    order,
                });

            const paginationData =
                responseHandler.getPaginationData(
                    result,
                    page,
                    limit
                );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Salutation list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error('List salutation error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching salutation list'
            );

        }
    };

    get = async (id) => {
        try {

            const data = await this._checkExists(id);

            if (!data) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Salutation not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Salutation fetched successfully',
                data
            );

        } catch (err) {

            logger.error('Get salutation error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching salutation'
            );

        }
    };

    update = async (id, body) => {
        try {

            const oldData = await this._checkExists(id);

            if (!oldData) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Salutation not found'
                );

            }

            if (
                body.salutation_name &&
                body.salutation_name !== oldData.salutation_name
            ) {

                const exists =
                    await this.salutationDao.findOneByWhere({
                        salutation_name: body.salutation_name,
                        is_deleted: false,
                        salutation_id: {
                            [Op.ne]: id
                        }
                    });

                if (exists) {

                    return responseHandler.returnError(
                        httpStatus.BAD_REQUEST,
                        'Salutation already exists'
                    );

                }
            }

            await this.salutationDao.updateWhere(
                {
                    ...body,
                    updated_date: new Date(),
                },
                {
                    salutation_id: id
                }
            );

            const updatedData =
                await this.salutationDao.findOneByWhere({
                    salutation_id: id,
                });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Salutation updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error('Update salutation error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error updating salutation'
            );

        }
    };

    delete = async (id) => {
        try {

            const oldData = await this._checkExists(id);

            if (!oldData) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Salutation not found'
                );

            }

            await this.salutationDao.updateWhere(
                {
                    is_deleted: true,
                    updated_date: new Date(),
                },
                {
                    salutation_id: id
                }
            );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Salutation deleted successfully'
            );

        } catch (err) {

            logger.error('Delete salutation error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error deleting salutation'
            );

        }
    };

}

module.exports = SalutationService;