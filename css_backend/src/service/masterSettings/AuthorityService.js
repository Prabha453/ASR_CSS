const httpStatus = require('http-status');
const AuthorityDao = require('../../dao/masterSettings/AuthorityDao');
const responseHandler = require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = [
    'name',
    'authority_type',
];

const FILTER_FIELDS = [
    'country_id',
    'jurisdiction_id',
    'authority_type',
    'is_active',
];

// Optional FK selects submit '' when left blank — MySQL rejects '' for an INTEGER
// column, so this must become null before it reaches the DAO (mirrors EventRuleService).
const normalizeId = (value) => (value === undefined || value === null || value === '' ? null : (Number(value) || null));

class AuthorityService {

    constructor() {
        this.authorityDao = new AuthorityDao();
    }

    async _checkExists(id) {
        return await this.authorityDao.findOneByWhere({
            authority_id: id,
            is_deleted: false,
        });
    }

    create = async (body) => {
        try {
            body.is_deleted = false;
            body.updated_date = new Date();
            body.country_id = normalizeId(body.country_id);
            body.jurisdiction_id = normalizeId(body.jurisdiction_id);

            const data = await this.authorityDao.create(body);

            if (!data) {
                return responseHandler.returnError(
                    httpStatus.INTERNAL_SERVER_ERROR,
                    'Error creating authority'
                );
            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Authority created successfully',
                data
            );
        } catch (err) {
            logger.error('Create authority error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error creating authority'
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
            const order = buildOrderClause(query.order, [['authority_id', 'DESC']]);

            const result = await this.authorityDao.findAndCountAll({
                where,
                limit,
                offset,
                order,
            });

            if (result.count === 0) {
                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No authorities found',
                    { totalItems: 0, data: [], totalPages: 0, currentPage: page }
                );
            }

            const paginationData = responseHandler.getPaginationData(result, page, limit);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Authority list fetched successfully',
                paginationData
            );
        } catch (err) {
            logger.error('List authority error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching authority list'
            );
        }
    };

    get = async (id) => {
        try {
            const data = await this._checkExists(id);

            if (!data) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Authority not found');
            }

            return responseHandler.returnSuccess(httpStatus.OK, 'Authority fetched successfully', data);
        } catch (err) {
            logger.error('Get authority error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching authority'
            );
        }
    };

    update = async (id, body) => {
        try {
            const oldData = await this._checkExists(id);

            if (!oldData) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Authority not found');
            }

            const updateResult = await this.authorityDao.updateWhere(
                {
                    ...body,
                    country_id: normalizeId(body.country_id),
                    jurisdiction_id: normalizeId(body.jurisdiction_id),
                    updated_date: new Date(),
                },
                { authority_id: id }
            );

            if (!updateResult) {
                return responseHandler.returnError(
                    httpStatus.INTERNAL_SERVER_ERROR,
                    'Error updating authority'
                );
            }

            const updatedData = await this.authorityDao.findOneByWhere({ authority_id: id });

            return responseHandler.returnSuccess(httpStatus.OK, 'Authority updated successfully', updatedData);
        } catch (err) {
            logger.error('Update authority error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error updating authority'
            );
        }
    };

    delete = async (id) => {
        try {
            const oldData = await this._checkExists(id);

            if (!oldData) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Authority not found');
            }

            await this.authorityDao.updateWhere(
                { is_deleted: true, updated_date: new Date() },
                { authority_id: id }
            );

            return responseHandler.returnSuccess(httpStatus.OK, 'Authority deleted successfully');
        } catch (err) {
            logger.error('Delete authority error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error deleting authority'
            );
        }
    };

}

module.exports = AuthorityService;
