const httpStatus = require('http-status');
const { Op } = require('sequelize');

const RaceMasterDao = require('../../dao/masterSettings/RaceMasterDao');

const responseHandler = require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = ['race_name'];

class RaceMasterService {

    constructor() {
        this.raceMasterDao = new RaceMasterDao();
    }

    async _checkExists(id) {

        return await this.raceMasterDao.findOneByWhere({
            race_id: id,
            is_deleted: false,
        });

    }

    create = async (body) => {
        try {

            const existing =
                await this.raceMasterDao.findOneByWhere({
                    race_name: body.race_name,
                    is_deleted: false,
                });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Race already exists'
                );

            }

            body.is_deleted = false;
            body.updated_date = new Date();

            const data =
                await this.raceMasterDao.create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Race created successfully',
                data
            );

        } catch (err) {

            logger.error('Create race error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error creating race'
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
                    [['race_id', 'DESC']]
                );

            const result =
                await this.raceMasterDao.findAndCountAll({
                    where,
                    limit,
                    offset,
                    order,
                });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No races found',
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
                'Race list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error('List race error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching race list'
            );

        }
    };

    get = async (id) => {
        try {

            const data = await this._checkExists(id);

            if (!data) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Race not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Race fetched successfully',
                data
            );

        } catch (err) {

            logger.error('Get race error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching race'
            );

        }
    };

    update = async (id, body) => {
        try {

            const oldData = await this._checkExists(id);

            if (!oldData) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Race not found'
                );

            }

            if (
                body.race_name &&
                body.race_name !== oldData.race_name
            ) {

                const exists =
                    await this.raceMasterDao.findOneByWhere({
                        race_name: body.race_name,
                        is_deleted: false,
                        race_id: {
                            [Op.ne]: id
                        }
                    });

                if (exists) {

                    return responseHandler.returnError(
                        httpStatus.BAD_REQUEST,
                        'Race already exists'
                    );

                }
            }

            await this.raceMasterDao.updateWhere(
                {
                    ...body,
                    updated_date: new Date(),
                },
                {
                    race_id: id
                }
            );

            const updatedData =
                await this.raceMasterDao.findOneByWhere({
                    race_id: id,
                });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Race updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error('Update race error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error updating race'
            );

        }
    };

    delete = async (id) => {
        try {

            const oldData = await this._checkExists(id);

            if (!oldData) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Race not found'
                );

            }

            await this.raceMasterDao.updateWhere(
                {
                    is_deleted: true,
                    updated_date: new Date(),
                },
                {
                    race_id: id
                }
            );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Race deleted successfully'
            );

        } catch (err) {

            logger.error('Delete race error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error deleting race'
            );

        }
    };

}

module.exports = RaceMasterService;