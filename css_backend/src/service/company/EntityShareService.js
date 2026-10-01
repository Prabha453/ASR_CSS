'use strict';

const httpStatus  = require('http-status');
const { v4: uuidv4 } = require('uuid');
const { Op }          = require('sequelize');

const { getCurrentModels }     = require('../../models');
const EntityShareDao           = require('../../dao/company/EntityShareDao');
const EntityShareHistoryDao    = require('../../dao/company/EntityShareHistoryDao');
const ShareTransactionDao      = require('../../dao/company/ShareTransactionDao');
const responseHandler          = require('../../helper/responseHandler');
const logger                   = require('../../config/logger');

class EntityShareService {

    constructor() {
        this.shareDao   = new EntityShareDao();
        this.historyDao = new EntityShareHistoryDao();
        this.txnDao     = new ShareTransactionDao();
    }

    // ── Associations ──────────────────────────────────────────────────────────

    _includes(models) {
        const inc = [];
        if (models.share_class_master) {
            inc.push({
                model:      models.share_class_master,
                as:         'share_class',
                required:   false,
                attributes: ['sc_id', 'sc_name', 'sc_slug', 'sc_type'],
            });
        }
        return inc;
    }

    _historyIncludes(models) {
        const inc = [];
        if (models.share_class_master) {
            inc.push({
                model:      models.share_class_master,
                as:         'share_class',
                required:   false,
                attributes: ['sc_id', 'sc_name', 'sc_slug'],
            });
        }
        return inc;
    }

    // ── Computed fields ───────────────────────────────────────────────────────

    _computeCalcFields(body) {
        const shares  = parseFloat(body.number_of_shares)    || 0;
        const paid    = parseFloat(body.paid_up_capital)      || 0;
        const issued  = parseFloat(body.issued_share_capital) || 0;
        return {
            per_share:        shares > 0 ? paid   / shares : 0,
            issued_per_share: shares > 0 ? issued / shares : 0,
        };
    }

    // ── LIST ──────────────────────────────────────────────────────────────────

    list = async (params) => {
        try {
            const models  = getCurrentModels();
            const page    = parseInt(params.page  || 1, 10);
            const limit   = parseInt(params.limit || 20, 10);
            const offset  = (page - 1) * limit;

            const where = { is_deleted: 0 };
            if (params.entity_id)    where.entity_id    = params.entity_id;
            if (params.currency)     where.currency     = params.currency;
            if (params.share_class_id) where.share_class_id = params.share_class_id;
            if (params.share_type)   where.share_type   = params.share_type;

            const result = await this.shareDao.findAndCountAll({
                where,
                include: this._includes(models),
                limit,
                offset,
                order: [['created_at', 'DESC']],
            });

            // Inject allotted_shares — total shares currently held by all shareholders.
            // Must count both IN (active holdings) and NONE (balance rows after transfer),
            // both with status=VALID. Counting only 'IN' misses balance rows; counting INVALID
            // rows double-counts source rows that were superseded by a transfer.
            if (result.rows.length && models.share_transactions) {
                const shareIds = result.rows.map(r => r.id);
                const { Sequelize } = require('sequelize');
                const sums = await this.txnDao.Model.findAll({
                    where: {
                        company_share_id:   { [Op.in]: shareIds },
                        transaction_status: { [Op.in]: ['IN', 'NONE'] },
                        status:             'VALID',
                        is_deleted:         0,
                    },
                    attributes: [
                        'company_share_id',
                        [Sequelize.fn('SUM', Sequelize.col('no_of_shares')), 'total_allotted'],
                    ],
                    group: ['company_share_id'],
                    raw: true,
                });
                const sumMap = {};
                sums.forEach(s => { sumMap[s.company_share_id] = Number(s.total_allotted || 0); });
                result.rows.forEach(r => { r.dataValues.allotted_shares = sumMap[r.id] || 0; });
            }

            return responseHandler.returnSuccess(httpStatus.OK, 'Shares fetched', {
                totalItems:  result.count,
                data:        result.rows,
                totalPages:  Math.ceil(result.count / limit),
                currentPage: page,
            });
        } catch (e) {
            logger.error(e);
            return responseHandler.returnError(httpStatus.BAD_GATEWAY, e.message);
        }
    };

    // ── GET ───────────────────────────────────────────────────────────────────

    get = async (id) => {
        try {
            const models = getCurrentModels();
            const share  = await this.shareDao.findOneByWhere(
                { id, is_deleted: 0 },
                null,
                null,
            );
            if (!share) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Share not found');

            const data = await this.shareDao.findAndCountAll({
                where:   { id, is_deleted: 0 },
                include: this._includes(models),
                limit:   1,
            });

            return responseHandler.returnSuccess(httpStatus.OK, 'Share fetched', data.rows[0] || share);
        } catch (e) {
            logger.error(e);
            return responseHandler.returnError(httpStatus.BAD_GATEWAY, e.message);
        }
    };

    // ── CREATE ────────────────────────────────────────────────────────────────

    create = async (body, userId) => {
        const models = getCurrentModels();
        const t      = await models.sequelize.transaction();
        try {
            const calc       = this._computeCalcFields(body);

            // ── Duplicate check ───────────────────────────────────────────────
            // Same currency + share_class_id + share_type + per_share = duplicate.
            // Different per_share = new tranche, allow insert.
            const duplicate = await this.shareDao.findOneByWhere({
                entity_id:     body.entity_id,
                currency:      body.currency,
                share_class_id: body.share_class_id,
                share_type:    body.share_type || 'NORMAL',
                is_deleted:    0,
            });

            if (duplicate) {
                const existingPerShare = parseFloat(duplicate.per_share) || 0;
                const newPerShare      = calc.per_share;
                const samePerShare     = Math.abs(existingPerShare - newPerShare) < 0.0001;

                if (samePerShare) {
                    await t.rollback();
                    return responseHandler.returnError(
                        httpStatus.BAD_REQUEST,
                        'Share already exists with the same currency, class, type and per-share price. Use Share Increase to add more shares to this record.'
                    );
                }
                // Different per_share → allow as a new tranche (fall through)
            }

            const shareSetId = uuidv4();

            const share = await models.entity_shares.create({
                entity_id:               body.entity_id,
                currency:                body.currency,
                share_class_id:          body.share_class_id,
                share_type:              body.share_type || 'NORMAL',
                number_of_shares:        body.number_of_shares,
                authorized_share_capital: body.authorized_share_capital,
                issued_share_capital:    body.issued_share_capital,
                paid_up_capital:         body.paid_up_capital,
                per_share:               calc.per_share,
                issued_per_share:        calc.issued_per_share,
                guarantee_amount:        body.guarantee_amount || null,
                date_of_transaction:     body.date_of_transaction,
                source_from:             body.source_from || 'MANUAL',
                workflow_id:             body.workflow_id || null,
                workflow_status:         body.workflow_status || null,
                is_workflow:             body.is_workflow || 0,
                is_acra:                 body.is_acra || 0,
                is_vot:                  body.is_vot || 0,
                is_deleted:              0,
                share_set_id:            shareSetId,
                created_by:              userId,
                updated_by:              userId,
            }, { transaction: t });

            await models.entity_share_history.create({
                entity_shares_id:        share.id,
                entity_id:               body.entity_id,
                transaction_type:        body.transaction_type || 'allotment',
                currency:                body.currency,
                share_class_id:          body.share_class_id,
                share_type:              body.share_type || 'NORMAL',
                number_of_shares:        body.number_of_shares,
                authorized_share_capital: body.authorized_share_capital,
                issued_share_capital:    body.issued_share_capital,
                paid_up_capital:         body.paid_up_capital,
                per_share:               calc.per_share,
                issued_per_share:        calc.issued_per_share,
                guarantee_amount:        body.guarantee_amount || null,
                delta_shares:            null,
                delta_authorized_capital: null,
                delta_issued_capital:    null,
                delta_paid_capital:      null,
                delta_guarantee_amount:  null,
                date_of_transaction:     body.date_of_transaction,
                source_from:             body.source_from || 'MANUAL',
                workflow_id:             body.workflow_id || null,
                workflow_status:         body.workflow_status || null,
                is_workflow:             body.is_workflow || 0,
                is_acra:                 body.is_acra || 0,
                is_vot:                  body.is_vot || 0,
                share_set_id:            shareSetId,
                remarks:                 body.remarks || null,
                created_by:              userId,
            }, { transaction: t });

            await t.commit();
            return responseHandler.returnSuccess(httpStatus.CREATED, 'Share created successfully', share);
        } catch (e) {
            await t.rollback();
            logger.error(e);
            return responseHandler.returnError(httpStatus.BAD_GATEWAY, e.message);
        }
    };

    // ── UPDATE ────────────────────────────────────────────────────────────────

    update = async (id, body, userId) => {
        const models = getCurrentModels();
        const t      = await models.sequelize.transaction();
        try {
            const existing = await this.shareDao.findOneByWhere({ id, is_deleted: 0 });
            if (!existing) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Share not found');

            const calc = this._computeCalcFields(body);

            const deltaShares    = parseFloat(body.number_of_shares)     - existing.number_of_shares;
            const deltaAuth      = parseFloat(body.authorized_share_capital) - existing.authorized_share_capital;
            const deltaIssued    = parseFloat(body.issued_share_capital)  - existing.issued_share_capital;
            const deltaPaid      = parseFloat(body.paid_up_capital)       - existing.paid_up_capital;
            const deltaGuarantee = (body.guarantee_amount != null)
                ? parseFloat(body.guarantee_amount) - (existing.guarantee_amount || 0)
                : null;

            await models.entity_shares.update({
                currency:                body.currency,
                share_class_id:          body.share_class_id,
                share_type:              body.share_type,
                number_of_shares:        body.number_of_shares,
                authorized_share_capital: body.authorized_share_capital,
                issued_share_capital:    body.issued_share_capital,
                paid_up_capital:         body.paid_up_capital,
                per_share:               calc.per_share,
                issued_per_share:        calc.issued_per_share,
                guarantee_amount:        body.guarantee_amount || null,
                date_of_transaction:     body.date_of_transaction,
                updated_by:              userId,
            }, { where: { id }, transaction: t });

            await models.entity_share_history.create({
                entity_shares_id:        id,
                entity_id:               existing.entity_id,
                transaction_type:        body.transaction_type,
                currency:                body.currency,
                share_class_id:          body.share_class_id,
                share_type:              body.share_type,
                number_of_shares:        body.number_of_shares,
                authorized_share_capital: body.authorized_share_capital,
                issued_share_capital:    body.issued_share_capital,
                paid_up_capital:         body.paid_up_capital,
                per_share:               calc.per_share,
                issued_per_share:        calc.issued_per_share,
                guarantee_amount:        body.guarantee_amount || null,
                delta_shares:            deltaShares,
                delta_authorized_capital: deltaAuth,
                delta_issued_capital:    deltaIssued,
                delta_paid_capital:      deltaPaid,
                delta_guarantee_amount:  deltaGuarantee,
                date_of_transaction:     body.date_of_transaction,
                source_from:             body.source_from || 'MANUAL',
                workflow_id:             body.workflow_id || null,
                workflow_status:         body.workflow_status || null,
                is_workflow:             body.is_workflow || 0,
                is_acra:                 body.is_acra || 0,
                is_vot:                  body.is_vot || 0,
                share_set_id:            existing.share_set_id,
                remarks:                 body.remarks || null,
                created_by:              userId,
            }, { transaction: t });

            await t.commit();
            return responseHandler.returnSuccess(httpStatus.OK, 'Share updated successfully');
        } catch (e) {
            await t.rollback();
            logger.error(e);
            return responseHandler.returnError(httpStatus.BAD_GATEWAY, e.message);
        }
    };

    // ── DELETE ────────────────────────────────────────────────────────────────

    delete = async (id, userId) => {
        const models = getCurrentModels();
        const t      = await models.sequelize.transaction();
        try {
            const existing = await this.shareDao.findOneByWhere({ id, is_deleted: 0 });
            if (!existing) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Share not found');

            await models.entity_shares.update(
                { is_deleted: 1, updated_by: userId },
                { where: { id }, transaction: t }
            );

            await models.entity_share_history.create({
                entity_shares_id:        id,
                entity_id:               existing.entity_id,
                transaction_type:        'cancel',
                currency:                existing.currency,
                share_class_id:          existing.share_class_id,
                share_type:              existing.share_type,
                number_of_shares:        existing.number_of_shares,
                authorized_share_capital: existing.authorized_share_capital,
                issued_share_capital:    existing.issued_share_capital,
                paid_up_capital:         existing.paid_up_capital,
                per_share:               existing.per_share,
                issued_per_share:        existing.issued_per_share,
                guarantee_amount:        existing.guarantee_amount,
                delta_shares:            null,
                delta_authorized_capital: null,
                delta_issued_capital:    null,
                delta_paid_capital:      null,
                delta_guarantee_amount:  null,
                date_of_transaction:     existing.date_of_transaction,
                source_from:             existing.source_from,
                is_workflow:             0,
                is_acra:                 0,
                is_vot:                  0,
                share_set_id:            existing.share_set_id,
                remarks:                 'Share record deleted',
                created_by:              userId,
            }, { transaction: t });

            await t.commit();
            return responseHandler.returnSuccess(httpStatus.OK, 'Share deleted successfully');
        } catch (e) {
            await t.rollback();
            logger.error(e);
            return responseHandler.returnError(httpStatus.BAD_GATEWAY, e.message);
        }
    };

    // ── HISTORY ───────────────────────────────────────────────────────────────

    history = async (params) => {
        try {
            const models = getCurrentModels();
            const page   = parseInt(params.page  || 1, 10);
            const limit  = parseInt(params.limit || 50, 10);
            const offset = (page - 1) * limit;

            const where = {};
            if (params.entity_id)       where.entity_id       = params.entity_id;
            if (params.entity_shares_id) where.entity_shares_id = params.entity_shares_id;
            if (params.share_set_id)    where.share_set_id    = params.share_set_id;
            if (params.transaction_type) where.transaction_type = params.transaction_type;

            const result = await this.historyDao.findAndCountAll({
                where,
                include: this._historyIncludes(models),
                limit,
                offset,
                order: [['created_at', 'DESC']],
            });

            return responseHandler.returnSuccess(httpStatus.OK, 'History fetched', {
                totalItems:  result.count,
                data:        result.rows,
                totalPages:  Math.ceil(result.count / limit),
                currentPage: page,
            });
        } catch (e) {
            logger.error(e);
            return responseHandler.returnError(httpStatus.BAD_GATEWAY, e.message);
        }
    };
}

module.exports = EntityShareService;
