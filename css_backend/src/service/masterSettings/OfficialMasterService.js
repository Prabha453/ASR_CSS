const httpStatus = require('http-status');

const { Op } = require('sequelize');

const OfficialMasterDao =
    require('../../dao/masterSettings/OfficialMasterDao');

const generateUniqueSlug =
    require('../../helper/generateUniqueSlug');

const responseHandler =
    require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = [
    'official_master_name',
    'official_master_slug'
];

const FILTER_FIELDS = [
    'official_master_name'
];

class OfficialMasterService {

    constructor() {
        this.officialMasterDao = new OfficialMasterDao();
    }

    async _checkExists(id) {
        return await this.officialMasterDao.findOneByWhere({
            official_master_id: id,
            is_deleted: false,
        });
    }

    create = async (body) => {
        try {

            const existing = await this.officialMasterDao.findOneByWhere({
                official_master_name: body.official_master_name,
                is_deleted: false,
            });

            if (existing) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Official master already exists'
                );
            }

            body.official_master_slug = await generateUniqueSlug(
                this.officialMasterDao.Model,
                body.official_master_name,
                'official_master_slug',
                'official_master_id'
            );

            body.is_deleted   = false;
            body.updated_date = new Date();

            const data = await this.officialMasterDao.create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Official master created successfully',
                data
            );

        } catch (err) {
            logger.error('Create official master error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error creating official master'
            );
        }
    };

    list = async (query) => {
        try {

            // fetch_all=1  →  include inactive rows too
            const baseWhere ={ is_deleted: false };

            /**
             * is_parent filtering:
             *   ?is_parent=0          → only top-level officials (is_parent = 0)
             *   ?is_parent=<id>       → sub-roles under that parent id
             *   ?is_parent_not_zero=1 → all sub-roles (is_parent != 0)
             *   (no param)            → all records
             */
            if (query.is_parent !== undefined && query.is_parent !== '') {
                baseWhere.is_parent = Number(query.is_parent);
            }

            if (query.is_parent_not_zero === '1' || query.is_parent_not_zero === 1) {
                baseWhere.is_parent = { [Op.ne]: 0 };
            }

            const where = buildCompleteWhere({
                query,
                searchFields: SEARCH_FIELDS,
                filterFields: FILTER_FIELDS,
                baseWhere,
            });

            const { page, limit, offset } = getPaginationParams(query, 10);

            const order = buildOrderClause(
                query.order,
                [['official_master_id', 'DESC']]
            );

            const result = await this.officialMasterDao.findAndCountAll({
                where,
                limit,
                offset,
                order,
            });

            if (result.count === 0) {
                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No official masters found',
                    {
                        totalItems:  0,
                        data:        [],
                        totalPages:  0,
                        currentPage: page,
                    }
                );
            }

            let paginationData = responseHandler.getPaginationData(result, page, limit);

            const getLastRecord = await this.officialMasterDao.findOneByWhere(
                { is_deleted: false },
                ['official_master_id'],
                [['official_master_id', 'DESC']]
            );

            paginationData.auto_order_number = getLastRecord
                ? getLastRecord.official_master_id + 1
                : 1;

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Official master list fetched successfully',
                paginationData
            );

        } catch (err) {
            logger.error('List official master error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching official master list'
            );
        }
    };

    get = async (id) => {
        try {

            const data = await this._checkExists(id);
            if (!data) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Official master not found'
                );
            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Official master fetched successfully',
                data
            );

        } catch (err) {
            logger.error('Get official master error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching official master'
            );
        }
    };

    update = async (id, body) => {
        try {

            const oldData = await this._checkExists(id);
            if (!oldData) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Official master not found'
                );
            }

            if (
                body.official_master_name &&
                body.official_master_name !== oldData.official_master_name
            ) {
                const exists = await this.officialMasterDao.findOneByWhere({
                    official_master_name: body.official_master_name,
                    is_deleted:           false,
                    official_master_id:   { [Op.ne]: id },
                });

                if (exists) {
                    return responseHandler.returnError(
                        httpStatus.BAD_REQUEST,
                        'Official master already exists'
                    );
                }

                body.official_master_slug = await generateUniqueSlug(
                    this.officialMasterDao.Model,
                    body.official_master_name,
                    'official_master_slug',
                    'official_master_id',
                    id
                );
            }

            await this.officialMasterDao.updateWhere(
                { ...body, updated_date: new Date() },
                { official_master_id: id }
            );

            const updatedData = await this.officialMasterDao.findOneByWhere({
                official_master_id: id,
            });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Official master updated successfully',
                updatedData
            );

        } catch (err) {
            logger.error('Update official master error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error updating official master'
            );
        }
    };

    delete = async (id) => {
        try {

            const oldData = await this._checkExists(id);
            if (!oldData) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Official master not found'
                );
            }

            await this.officialMasterDao.updateWhere(
                { is_deleted: true, updated_date: new Date() },
                { official_master_id: id }
            );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Official master deleted successfully'
            );

        } catch (err) {
            logger.error('Delete official master error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error deleting official master'
            );
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // saveConfig
    //
    // Saves:
    //   1. is_representative + is_entity_type  on the parent official
    //   2. is_active for every linked sub-role:
    //        checked   (is_checked = true)  → is_active = 0   (active record)
    //        unchecked (is_checked = false) → is_active = 1   (inactive record)
    // ─────────────────────────────────────────────────────────────────────────
    saveConfig = async (id, body) => {
        try {

            // ── 1. Validate parent exists ──────────────────────────────────
            const parent = await this.officialMasterDao.findOneByWhere({
                official_master_id: id,
                is_deleted:         false,
            });

            if (!parent) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Official master not found'
                );
            }

            // ── 2. Update parent: is_representative + is_entity_type ───────
            await this.officialMasterDao.updateWhere(
                {
                    is_representative : body.is_representative ?? parent.is_representative,
                    is_entity_type    : body.is_entity_type    ?? parent.is_entity_type,
                    updated_by        : body.updated_by,
                    updated_date      : new Date(),
                },
                { official_master_id: id }
            );

            // ── 3. Update each sub-role's is_active ────────────────────────
            /**
             * body.sub_roles = [
             *   { official_master_id: 5, is_checked: true  },  → is_active = 0 (active)
             *   { official_master_id: 6, is_checked: false },  → is_active = 1 (inactive)
             * ]
             */
            const subRoles = Array.isArray(body.sub_roles) ? body.sub_roles : [];

            if (subRoles.length > 0) {

                // Validate: all sub_roles must belong to this parent (security check)
                const subRoleIds = subRoles.map(r => r.official_master_id);

                const existingSubRoles = await this.officialMasterDao.findByWhere({
                    official_master_id : { [Op.in]: subRoleIds },
                    is_parent          : id,   // must be children of this parent
                });

                const validIds = new Set(
                    existingSubRoles.map(r => r.official_master_id)
                );

                const updatePromises = subRoles
                    .filter(role => validIds.has(role.official_master_id))  // only valid children
                    .map(role => {
                        // checked   → is_active = 0 (active)
                        // unchecked → is_active = 1 (inactive)
                        const isActive = role.is_checked ? 0 : 1;

                        return this.officialMasterDao.updateWhere(
                            {
                                is_active    : isActive,
                                updated_by   : body.updated_by,
                                updated_date : new Date(),
                            },
                            { official_master_id: role.official_master_id }
                        );
                    });

                await Promise.all(updatePromises);
            }

            // ── 4. Return updated parent ───────────────────────────────────
            const updatedParent = await this.officialMasterDao.findOneByWhere({
                official_master_id: id,
            });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Configuration saved successfully',
                updatedParent
            );

        } catch (err) {
            logger.error('Save config official master error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error saving configuration'
            );
        }
    };

}

module.exports = OfficialMasterService;