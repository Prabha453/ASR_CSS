const httpStatus = require('http-status');
const { Op } = require('sequelize');

const LanguageDao = require('../../dao/masterSettings/LanguageDao');

const responseHandler = require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = [
    'l_type',
    'l_page',
    'l_label',
    'l_value',
    'locale',
];

const FILTER_FIELDS = [
    'l_type',
    'l_page',
    'locale',
];

class LanguageService {

    constructor() {
        this.languageDao = new LanguageDao();
    }

    async _checkExists(id) {

        return await this.languageDao.findOneByWhere({
            language_id: id,
            is_deleted: false,
        });

    }

    create = async (body) => {
        try {

            const existing =
                await this.languageDao.findOneByWhere({
                    l_page: body.l_page,
                    l_label: body.l_label,
                    locale: body.locale,
                    is_deleted: false,
                });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Language key already exists'
                );

            }

            body.is_deleted = false;
            body.updated_date = new Date();

            const data =
                await this.languageDao.create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Language created successfully',
                data
            );

        } catch (err) {

            logger.error('Create language error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error creating language'
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
                    [['language_id', 'DESC']]
                );

            const result =
                await this.languageDao.findAndCountAll({
                    where,
                    limit,
                    offset,
                    order,
                });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No languages found',
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
                'Language list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error('List language error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching language list'
            );

        }
    };

    get = async (id) => {
        try {

            const data = await this._checkExists(id);

            if (!data) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Language not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Language fetched successfully',
                data
            );

        } catch (err) {

            logger.error('Get language error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching language'
            );

        }
    };

    update = async (id, body) => {
        try {

            const oldData = await this._checkExists(id);

            if (!oldData) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Language not found'
                );

            }

            const l_page = body.l_page || oldData.l_page;
            const l_label = body.l_label || oldData.l_label;
            const locale = body.locale || oldData.locale;

            const exists =
                await this.languageDao.findOneByWhere({
                    l_page,
                    l_label,
                    locale,
                    is_deleted: false,
                    language_id: {
                        [Op.ne]: id
                    }
                });

            if (exists) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Language key already exists'
                );

            }

            await this.languageDao.updateWhere(
                {
                    ...body,
                    updated_date: new Date(),
                },
                {
                    language_id: id
                }
            );

            const updatedData =
                await this.languageDao.findOneByWhere({
                    language_id: id,
                });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Language updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error('Update language error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error updating language'
            );

        }
    };

    delete = async (id) => {
        try {

            const oldData = await this._checkExists(id);

            if (!oldData) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Language not found'
                );

            }

            await this.languageDao.updateWhere(
                {
                    is_deleted: true,
                    updated_date: new Date(),
                },
                {
                    language_id: id
                }
            );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Language deleted successfully'
            );

        } catch (err) {

            logger.error('Delete language error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error deleting language'
            );

        }
    };

}

module.exports = LanguageService;