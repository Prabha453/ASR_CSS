const httpStatus = require('http-status');
const { Op } = require('sequelize');
const CountriesDao = require('../dao/masterSettings/CountriesDao');
const responseHandler = require('../helper/responseHandler');
const logger = require('../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../helper/searchHelper');

const COUNTRY_SEARCH_FIELDS = ['name','country_name','nationality','iso3','currency_code'];

class CommonService {

    constructor() {
        this.countriesDao = new CountriesDao();
    }

    async _checkExists(id) {

        return await this.countriesDao.findOneByWhere({
            id : id,
            is_delete : '0',
        });
    }

    countryList = async (query) => {
        try {

            const where = buildCompleteWhere({
                query,
                searchFields: COUNTRY_SEARCH_FIELDS,
                filterFields: [],
                baseWhere: { is_delete: '0' },
            });

            const { page, limit, offset } =
                getPaginationParams(query, 10);

            const order =
                buildOrderClause(
                    query.order,
                    [['id', 'DESC']]
                );

            const result =
                await this.countriesDao.findAndCountAll({
                    where,
                    limit,
                    offset,
                    order,
                });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No countries found',
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
                'Countries list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error('List countries error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching countries list'
            );

        }
    };

    getCountry = async (id) => {
        try {

            const data = await this._checkExists(id);

            if (!data) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Countries not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Countries fetched successfully',
                data
            );

        } catch (err) {

            logger.error('Get countries error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching countries'
            );

        }
    };


}

module.exports = CommonService;