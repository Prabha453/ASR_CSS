const httpStatus = require('http-status');

const { Op, Sequelize } = require('sequelize');

const CompanySSICCodeDao =
    require('../../dao/masterSettings/CompanySSICCodeDao');

const responseHandler =
    require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = [
    'ssic_code',
    'ssic_description',
    'country',
    'country_code',
    '$country_details.country_name$',
];

const FILTER_FIELDS = [
    'country',
    'country_code'
];

class CompanySSICCodeService {

    constructor() {

        this.companySSICCodeDao =
            new CompanySSICCodeDao();

    }

    async _checkExists(id) {

        return await this.companySSICCodeDao
            .findOneByWhere({
                ssic_id: id,
                is_deleted: false,
            });

    }

    create = async (body) => {
        try {

            const existing =
                await this.companySSICCodeDao
                    .findOneByWhere({
                        ssic_code: body.ssic_code,
                        country_code: body.country_code,
                        is_deleted: false,
                    });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'SSIC code already exists'
                );

            }

            body.is_deleted = false;

            body.updated_date = new Date();

            const data =
                await this.companySSICCodeDao
                    .create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'SSIC code created successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Create SSIC code error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error creating SSIC code'
            );

        }
    };

    list = async (query) => {
        try {

            const where =
                buildCompleteWhere({
                    query,
                    searchFields: SEARCH_FIELDS,
                    filterFields: FILTER_FIELDS,
                    baseWhere: {
                        is_deleted: false
                    },
                });

            const { page, limit, offset } =
                getPaginationParams(query, 10);

            const order =
                buildOrderClause(
                    query.order,
                    [['ssic_id', 'DESC']]
                );

            const result =
                await this.companySSICCodeDao.findAndCountAll({
                    where,
                    limit,
                    offset,
                    order,
                    include: [
                        {
                            association: 'country_details',
                            attributes: [],
                        },
                    ],
                    attributes: {
                        include: [
                            [
                                Sequelize.col('country_details.name'),
                                'country_name',
                            ],
                            [
                                Sequelize.col('country_details.iso'),
                                'country_iso',
                            ],
                            [
                                Sequelize.col('country_details.iso3'),
                                'country_iso3',
                            ],
                        ],
                    },
                });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No SSIC codes found',
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
                'SSIC code list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error(
                'List SSIC code error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching SSIC code list'
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
                    'SSIC code not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'SSIC code fetched successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Get SSIC code error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching SSIC code'
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
                    'SSIC code not found'
                );

            }

            const exists =
                await this.companySSICCodeDao
                    .findOneByWhere({
                        ssic_code: body.ssic_code,
                        country_code: body.country_code,
                        is_deleted: false,
                        ssic_id: {
                            [Op.ne]: id
                        }
                    });

            if (exists) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'SSIC code already exists'
                );

            }

            await this.companySSICCodeDao
                .updateWhere(
                    {
                        ...body,
                        updated_date: new Date(),
                    },
                    {
                        ssic_id: id
                    }
                );

            const updatedData =
                await this.companySSICCodeDao
                    .findOneByWhere({
                        ssic_id: id,
                    });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'SSIC code updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error(
                'Update SSIC code error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error updating SSIC code'
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
                    'SSIC code not found'
                );

            }

            await this.companySSICCodeDao
                .updateWhere(
                    {
                        is_deleted: true,
                        updated_date: new Date(),
                    },
                    {
                        ssic_id: id
                    }
                );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'SSIC code deleted successfully'
            );

        } catch (err) {

            logger.error(
                'Delete SSIC code error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error deleting SSIC code'
            );

        }
    };

}

module.exports = CompanySSICCodeService;