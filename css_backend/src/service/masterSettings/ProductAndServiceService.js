const httpStatus = require('http-status');
const { Op, Sequelize } = require('sequelize');

const ProductAndServiceDao =
    require('../../dao/masterSettings/ProductAndServiceDao');

const responseHandler =
    require('../../helper/responseHandler');

const logger =
    require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = [
    'item_name',
    'currency_code',
    'service_type',
];

const FILTER_FIELDS = [
    'status',
    'currency_code',
    'service_type',
    'category_id',
];

class ProductAndServiceService {

    constructor() {
        this.productAndServiceDao =
            new ProductAndServiceDao();
    }

    async _checkExists(id) {

        return await this.productAndServiceDao.Model.findOne({
            where: {
                product_service_id: id,
                is_deleted: false,
            },
            include: [
                {
                    association: 'categoryDetails',
                    attributes: [],
                },
            ],
            attributes: {
                include: [
                    [
                        Sequelize.col(
                            'categoryDetails.service_name'
                        ),
                        'category_name',
                    ],
                ],
            },
        });

    }

    create = async (body) => {
        try {

            const existing =
                await this.productAndServiceDao.findOneByWhere({
                    item_name: body.item_name,
                    category_id: body.category_id,
                    is_deleted: false,
                });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Product / Service already exists'
                );

            }

            body.is_deleted = false;
            body.updated_date = new Date();

            const created =
                await this.productAndServiceDao.create(body);

            const data =
                await this._checkExists(
                    created.product_service_id
                );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Product / Service created successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Create product service error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error creating product service'
            );

        }
    };

    list = async (query) => {
        try {

            const where = buildCompleteWhere({
                query,
                searchFields: SEARCH_FIELDS,
                filterFields: FILTER_FIELDS,
                baseWhere: {
                    is_deleted: false,
                },
            });

            const {
                page,
                limit,
                offset,
            } = getPaginationParams(query, 10);

            const order =
                buildOrderClause(
                    query.order,
                    [['product_service_id', 'DESC']]
                );

            const result =
                await this.productAndServiceDao.Model.findAndCountAll({
                    where,
                    limit,
                    offset,
                    order,
                    include: [
                        {
                            association: 'categoryDetails',
                            attributes: [],
                        },
                    ],
                    attributes: {
                        include: [
                            [
                                Sequelize.col(
                                    'categoryDetails.service_name'
                                ),
                                'category_name',
                            ],
                        ],
                    },
                });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No product services found',
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
                'Product service list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error(
                'List product service error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching product service list'
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
                    'Product / Service not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Product / Service fetched successfully',
                data
            );

        } catch (err) {

            logger.error(
                'Get product service error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching product service'
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
                    'Product / Service not found'
                );

            }

            const exists =
                await this.productAndServiceDao.findOneByWhere({
                    item_name: body.item_name,
                    category_id: body.category_id,
                    is_deleted: false,
                    product_service_id: {
                        [Op.ne]: id,
                    },
                });

            if (exists) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Product / Service already exists'
                );

            }

            await this.productAndServiceDao.updateWhere(
                {
                    ...body,
                    updated_date: new Date(),
                },
                {
                    product_service_id: id,
                }
            );

            const updatedData =
                await this._checkExists(id);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Product / Service updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error(
                'Update product service error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error updating product service'
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
                    'Product / Service not found'
                );

            }

            await this.productAndServiceDao.updateWhere(
                {
                    is_deleted: true,
                    updated_date: new Date(),
                },
                {
                    product_service_id: id,
                }
            );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Product / Service deleted successfully'
            );

        } catch (err) {

            logger.error(
                'Delete product service error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error deleting product service'
            );

        }
    };

}

module.exports = ProductAndServiceService;