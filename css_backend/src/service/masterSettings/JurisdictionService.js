const httpStatus = require('http-status');
const JurisdictionDao = require('../../dao/masterSettings/JurisdictionDao');
const responseHandler = require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = [
    'name',
    'code',
];

const FILTER_FIELDS = [
    'country_id',
    'parent_jurisdiction_id',
    'level',
    'is_active',
];

// Optional FK selects submit '' when left blank — MySQL rejects '' for an INTEGER
// column, so this must become null before it reaches the DAO (mirrors EventRuleService).
const normalizeId = (value) => (value === undefined || value === null || value === '' ? null : (Number(value) || null));

class JurisdictionService {

    constructor() {
        this.jurisdictionDao = new JurisdictionDao();
    }

    async _checkExists(id) {
        return await this.jurisdictionDao.findOneByWhere({
            jurisdiction_id: id,
            is_deleted: false,
        });
    }

    create = async (body) => {
        try {
            body.is_deleted = false;
            body.updated_date = new Date();
            body.parent_jurisdiction_id = normalizeId(body.parent_jurisdiction_id);

            const data = await this.jurisdictionDao.create(body);

            if (!data) {
                return responseHandler.returnError(
                    httpStatus.INTERNAL_SERVER_ERROR,
                    'Error creating jurisdiction'
                );
            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Jurisdiction created successfully',
                data
            );
        } catch (err) {
            logger.error('Create jurisdiction error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error creating jurisdiction'
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

            const { page, limit, offset } = getPaginationParams(query, 100);
            const order = buildOrderClause(query.order, [['jurisdiction_id', 'DESC']]);

            const result = await this.jurisdictionDao.findAndCountAll({
                where,
                limit,
                offset,
                order,
            });

            if (result.count === 0) {
                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No jurisdictions found',
                    { totalItems: 0, data: [], totalPages: 0, currentPage: page }
                );
            }

            const paginationData = responseHandler.getPaginationData(result, page, limit);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Jurisdiction list fetched successfully',
                paginationData
            );
        } catch (err) {
            logger.error('List jurisdiction error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching jurisdiction list'
            );
        }
    };

    get = async (id) => {
        try {
            const data = await this._checkExists(id);

            if (!data) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Jurisdiction not found');
            }

            return responseHandler.returnSuccess(httpStatus.OK, 'Jurisdiction fetched successfully', data);
        } catch (err) {
            logger.error('Get jurisdiction error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching jurisdiction'
            );
        }
    };

    update = async (id, body) => {
        try {
            const oldData = await this._checkExists(id);

            if (!oldData) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Jurisdiction not found');
            }

            const updateResult = await this.jurisdictionDao.updateWhere(
                { ...body, parent_jurisdiction_id: normalizeId(body.parent_jurisdiction_id), updated_date: new Date() },
                { jurisdiction_id: id }
            );

            if (!updateResult) {
                return responseHandler.returnError(
                    httpStatus.INTERNAL_SERVER_ERROR,
                    'Error updating jurisdiction'
                );
            }

            const updatedData = await this.jurisdictionDao.findOneByWhere({ jurisdiction_id: id });

            return responseHandler.returnSuccess(httpStatus.OK, 'Jurisdiction updated successfully', updatedData);
        } catch (err) {
            logger.error('Update jurisdiction error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error updating jurisdiction'
            );
        }
    };

    delete = async (id) => {
        try {
            const oldData = await this._checkExists(id);

            if (!oldData) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Jurisdiction not found');
            }

            await this.jurisdictionDao.updateWhere(
                { is_deleted: true, updated_date: new Date() },
                { jurisdiction_id: id }
            );

            return responseHandler.returnSuccess(httpStatus.OK, 'Jurisdiction deleted successfully');
        } catch (err) {
            logger.error('Delete jurisdiction error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error deleting jurisdiction'
            );
        }
    };

}

module.exports = JurisdictionService;
