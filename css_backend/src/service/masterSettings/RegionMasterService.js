const httpStatus = require('http-status');
const { Op, Sequelize } = require('sequelize');
const RegionMasterDao = require('../../dao/masterSettings/RegionMasterDao');
const responseHandler = require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = [
    'region_name',
];

const FILTER_FIELDS = [
    'region_name',
];

class RegionMasterService {

    constructor() {
        this.regionMasterDao = new RegionMasterDao();
    }

    async _checkExists(id) {

        return await this.regionMasterDao.findOneByWhere({
            region_id: id,
            is_deleted: false,
        });

    }

    create = async (body) => {
        try {

            const existing =
                await this.regionMasterDao.findOneByWhere({
                    region_name: body.region_name,
                    is_deleted: false,
                });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Region already exists'
                );

            }

            body.is_deleted = false;
            body.updated_date = new Date();

            const data =
                await this.regionMasterDao.create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Region created successfully',
                data
            );

        } catch (err) {

            logger.error('Create region error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error creating region'
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
                    [['region_id', 'DESC']]
                );

              const result =
                await this.regionMasterDao.findAndCountAll({
                    where,
                    limit,
                    offset,
                    order,
                });


            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No regions found',
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
                'Region list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error('List region error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching region list'
            );

        }
    };

    get = async (id) => {
        try {

            const data = await this._checkExists(id);

            if (!data) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Region not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Region fetched successfully',
                data
            );

        } catch (err) {

            logger.error('Get region error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching region'
            );

        }
    };

    update = async (id, body) => {
        try {

            const oldData = await this._checkExists(id);

            if (!oldData) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Region not found'
                );

            }

            const region_name =
                body.region_name || oldData.region_name;

            const exists =
                await this.regionMasterDao.findOneByWhere({
                    region_name,
                    is_deleted: false,
                    region_id: {
                        [Op.ne]: id
                    }
                });

            if (exists) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Region already exists'
                );

            }

            await this.regionMasterDao.updateWhere(
                {
                    ...body,
                    updated_date: new Date(),
                },
                {
                    region_id: id
                }
            );

            const updatedData =
                await this.regionMasterDao.findOneByWhere({
                    region_id: id,
                });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Region updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error('Update region error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error updating region'
            );

        }
    };

    delete = async (id) => {
        try {

            const oldData = await this._checkExists(id);

            if (!oldData) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Region not found'
                );

            }

            await this.regionMasterDao.updateWhere(
                {
                    is_deleted: true,
                    updated_date: new Date(),
                },
                {
                    region_id: id
                }
            );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Region deleted successfully'
            );

        } catch (err) {

            logger.error('Delete region error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error deleting region'
            );

        }
    };

}

module.exports = RegionMasterService;