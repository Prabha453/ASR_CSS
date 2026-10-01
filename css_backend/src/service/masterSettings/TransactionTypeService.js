const httpStatus = require('http-status');

const { Op } = require('sequelize');

const TransactionTypeDao =
    require('../../dao/masterSettings/TransactionTypeDao');

const responseHandler =
    require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = [
    't_type',
    't_name',
    't_type_no',
    't_type_name' // Add virtual field for searching
];

const FILTER_FIELDS = [
    't_type',
    't_type_name' // Add for filtering
];

class TransactionTypeService {

    constructor() {

        this.transactionTypeDao =
            new TransactionTypeDao();

    }

    // Helper method to get transaction type name
    _getTransactionTypeName(t_type) {
        const typeMap = {
            '1': 'Company',
            '2': 'Share Holder'
        };
        return typeMap[t_type] || 'Unknown';
    }

    // Helper method to format response data
    _formatTransactionType(data) {
        if (!data) return null;
        
        const formatted = data.toJSON ? data.toJSON() : { ...data };
        formatted.t_type_name = this._getTransactionTypeName(formatted.t_type);
        return formatted;
    }

    // Helper method to format array of data
    _formatTransactionTypes(dataArray) {
        return dataArray.map(item => this._formatTransactionType(item));
    }

    async _checkExists(id) {

        return await this.transactionTypeDao
            .findOneByWhere({
                t_id: id,
                is_deleted: false,
            });

    }

    create = async (body) => {
        try {

            const existing =
                await this.transactionTypeDao
                    .findOneByWhere({
                        t_type: body.t_type,
                        t_name: body.t_name,
                        is_deleted: false,
                    });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Transaction type already exists'
                );

            }

            body.is_deleted = false;

            body.updated_date = new Date();

            const data =
                await this.transactionTypeDao
                    .create(body);

            const formattedData = this._formatTransactionType(data);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Transaction type created successfully',
                formattedData
            );

        } catch (err) {

            logger.error(
                'Create transaction type error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error creating transaction type'
            );

        }
    };

    list = async (query) => {
        try {

            // Handle search for t_type_name
            let customWhere = {};
            if (query.search) {
                const searchLower = query.search.toLowerCase();
                if (searchLower.includes('company')) {
                    customWhere.t_type = 0;
                } else if (searchLower.includes('share') || searchLower.includes('holder')) {
                    customWhere.t_type = 1;
                }
            }

            // Handle filter for t_type_name
            if (query.filter_t_type_name) {
                const filterLower = query.filter_t_type_name.toLowerCase();
                if (filterLower === 'company') {
                    customWhere.t_type = 0;
                } else if (filterLower === 'share holder' || filterLower === 'shareholder') {
                    customWhere.t_type = 1;
                }
            }

            const where =
                buildCompleteWhere({
                    query,
                    searchFields: SEARCH_FIELDS.filter(f => f !== 't_type_name'), // Exclude virtual field
                    filterFields: FILTER_FIELDS.filter(f => f !== 't_type_name'), // Exclude virtual field
                    baseWhere: {
                        is_deleted: false,
                        ...customWhere
                    },
                });

            const { page, limit, offset } =
                getPaginationParams(query, 10);

            const order =
                buildOrderClause(
                    query.order,
                    [['t_id', 'DESC']]
                );

            const result =
                await this.transactionTypeDao
                    .findAndCountAll({
                        where,
                        limit,
                        offset,
                        order,
                    });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No transaction types found',
                    {
                        totalItems: 0,
                        data: [],
                        totalPages: 0,
                        currentPage: page,
                    }
                );

            }

            // Format all rows to include t_type_name
            const formattedRows = this._formatTransactionTypes(result.rows);

            let paginationData =
                responseHandler.getPaginationData(
                    { ...result, rows: formattedRows },
                    page,
                    limit
                );

            const getLastRecord = await this.transactionTypeDao.findOneByWhere(
                { is_deleted: false },
                ['t_id'],
                [['t_id', 'DESC']]
            );

            let autoOrderNumber = 1;
            
            if(getLastRecord){
               autoOrderNumber = getLastRecord.t_id + 1;
            }

            paginationData.auto_order_number = autoOrderNumber;

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Transaction type list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error(
                'List transaction type error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching transaction type list'
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
                    'Transaction type not found'
                );

            }

            const formattedData = this._formatTransactionType(data);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Transaction type fetched successfully',
                formattedData
            );

        } catch (err) {

            logger.error(
                'Get transaction type error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching transaction type'
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
                    'Transaction type not found'
                );

            }

            const exists =
                await this.transactionTypeDao
                    .findOneByWhere({
                        t_type: body.t_type,
                        t_name: body.t_name,
                        is_deleted: false,
                        t_id: {
                            [Op.ne]: id
                        }
                    });

            if (exists) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Transaction type already exists'
                );

            }

            await this.transactionTypeDao
                .updateWhere(
                    {
                        ...body,
                        updated_date: new Date(),
                    },
                    {
                        t_id: id
                    }
                );

            const updatedData =
                await this.transactionTypeDao
                    .findOneByWhere({
                        t_id: id,
                    });

            const formattedData = this._formatTransactionType(updatedData);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Transaction type updated successfully',
                formattedData
            );

        } catch (err) {

            logger.error(
                'Update transaction type error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error updating transaction type'
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
                    'Transaction type not found'
                );

            }

            await this.transactionTypeDao
                .updateWhere(
                    {
                        is_deleted: true,
                        updated_date: new Date(),
                    },
                    {
                        t_id: id
                    }
                );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Transaction type deleted successfully'
            );

        } catch (err) {

            logger.error(
                'Delete transaction type error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error deleting transaction type'
            );

        }
    };

}

module.exports = TransactionTypeService;