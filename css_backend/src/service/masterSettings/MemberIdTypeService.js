const httpStatus = require('http-status');
const { Op } = require('sequelize');

const MemberIdTypeDao = require('../../dao/masterSettings/MemberIdTypeDao');
const generateUniqueSlug = require('../../helper/generateUniqueSlug');
const responseHandler = require('../../helper/responseHandler');
const logger = require('../../config/logger');
const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

/*
|==========================================================================
| CONFIG
|==========================================================================
*/
const SEARCH_FIELDS = ['id_name', 'slug_name', 'country_code'];
const FILTER_FIELDS = ['country_code'];

class MemberIdTypeService {

    constructor() {
        this.memberIdTypeDao = new MemberIdTypeDao();
    }

    /*
    |==========================================================================
    | HELPER METHODS
    |==========================================================================
    */

    /**
     * Check if member ID type exists
     */
    async _checkExists(id) {
        return await this.memberIdTypeDao.findOneByWhere({
            m_identification_id: id,
            is_deleted: false,
        });
    }

    /*
    |==========================================================================
    | CREATE
    |==========================================================================
    */
    create = async (body) => {
        try {
            /*
            |----------------------------------------------------------------------
            | Duplicate name check
            |----------------------------------------------------------------------
            */
            const existingName = await this.memberIdTypeDao.findOneByWhere({
                id_name: body.id_name,
                is_deleted: false,
            });

            if (existingName) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Member identification type name already exists'
                );
            }

            /*
            |----------------------------------------------------------------------
            | Generate unique slug
            |----------------------------------------------------------------------
            */
            body.slug_name = await generateUniqueSlug(
                this.memberIdTypeDao.Model,
                body.id_name,
                'slug_name',
                'm_identification_id'
            );

            /*
            |----------------------------------------------------------------------
            | Set timestamps
            |----------------------------------------------------------------------
            */
            body.is_deleted = false;
            body.created_date = new Date();
            body.updated_date = new Date();

            /*
            |----------------------------------------------------------------------
            | Create record
            |----------------------------------------------------------------------
            */
            const data = await this.memberIdTypeDao.create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Member identification type created successfully',
                data
            );

        } catch (err) {
            logger.error('Create member ID type error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error creating member identification type'
            );
        }
    };

    /*
    |==========================================================================
    | LIST
    |==========================================================================
    */
    list = async (query) => {
        try {
            /*
            |----------------------------------------------------------------------
            | Build complete WHERE clause using helper
            |----------------------------------------------------------------------
            */
            const where = buildCompleteWhere({
                query,
                searchFields: SEARCH_FIELDS,
                filterFields: FILTER_FIELDS,
                baseWhere: { is_deleted: false },
                dateField: 'created_date',
            });

            /*
            |----------------------------------------------------------------------
            | Get pagination params
            |----------------------------------------------------------------------
            */
            const { page, limit, offset } = getPaginationParams(query, 10);

            /*
            |----------------------------------------------------------------------
            | Build order clause
            |----------------------------------------------------------------------
            */
            const order = buildOrderClause(query.order, [['m_identification_id', 'ASC']]);

            /*
            |----------------------------------------------------------------------
            | Fetch data
            |----------------------------------------------------------------------
            */
            const result = await this.memberIdTypeDao.findAndCountAll({
                where,
                limit,
                offset,
                order,
            });

            /*
            |----------------------------------------------------------------------
            | No data found
            |----------------------------------------------------------------------
            */
            if (result.count === 0) {
                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No member identification types found',
                    {
                        totalItems: 0,
                        data: [],
                        totalPages: 0,
                        currentPage: page,
                    }
                );
            }

            /*
            |----------------------------------------------------------------------
            | Format pagination data using helper
            |----------------------------------------------------------------------
            */
            const paginationData = responseHandler.getPaginationData(
                result,
                page,
                limit
            );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Member identification types fetched successfully',
                paginationData
            );

        } catch (err) {
            logger.error('List member ID types error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching member identification types'
            );
        }
    };

    /*
    |==========================================================================
    | GET
    |==========================================================================
    */
    get = async (id) => {
        try {
            const data = await this._checkExists(id);

            if (!data) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Member identification type not found'
                );
            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Member identification type fetched successfully',
                data
            );

        } catch (err) {
            logger.error('Get member ID type error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching member identification type'
            );
        }
    };

    /*
    |==========================================================================
    | UPDATE
    |==========================================================================
    */
    update = async (id, body) => {
        try {
            const oldData = await this._checkExists(id);

            if (!oldData) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Member identification type not found'
                );
            }

            if (body.id_name && body.id_name !== oldData.id_name) {
                const nameExists = await this.memberIdTypeDao.findOneByWhere({
                    id_name: body.id_name,
                    is_deleted: false,
                    m_identification_id: { [Op.ne]: id }
                });

                if (nameExists) {
                    return responseHandler.returnError(
                        httpStatus.BAD_REQUEST,
                        'Member identification type name already exists'
                    );
                }

                body.slug_name = await generateUniqueSlug(
                    this.memberIdTypeDao.Model,
                    body.id_name,
                    'slug_name',
                    'm_identification_id',
                    id
                );
            }

            const payload = {
                ...body,
                updated_date: new Date(),
            };

            await this.memberIdTypeDao.updateWhere(
                payload,
                { m_identification_id: id }
            );

            const updatedData = await this.memberIdTypeDao.findOneByWhere({
                m_identification_id: id,
            });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Member identification type updated successfully',
                updatedData
            );

        } catch (err) {
            logger.error('Update member ID type error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error updating member identification type'
            );
        }
    };

    /*
    |==========================================================================
    | DELETE
    |==========================================================================
    */
    delete = async (id) => {
        try {
            const oldData = await this._checkExists(id);

            if (!oldData) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Member identification type not found'
                );
            }

            await this.memberIdTypeDao.updateWhere(
                {
                    is_deleted: true,
                    updated_date: new Date(),
                },
                { m_identification_id: id }
            );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Member identification type deleted successfully'
            );

        } catch (err) {
            logger.error('Delete member ID type error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error deleting member identification type'
            );
        }
    };

}

module.exports = MemberIdTypeService;