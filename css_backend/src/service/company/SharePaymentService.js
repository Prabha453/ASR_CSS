'use strict';

const httpStatus      = require('http-status');
const { v4: uuidv4 } = require('uuid');

const SharePaymentDao     = require('../../dao/company/SharePaymentDao');
const ShareTransactionDao = require('../../dao/company/ShareTransactionDao');
const responseHandler     = require('../../helper/responseHandler');
const logger              = require('../../config/logger');

class SharePaymentService {

    constructor() {
        this.paymentDao = new SharePaymentDao();
        this.txnDao     = new ShareTransactionDao();
    }

    // ── List payments for a transaction ─────────────────────────────────────
    async list(txn_id) {
        try {
            const rows = await this.paymentDao.Model.findAll({
                where: { share_transaction_id: txn_id, is_deleted: 0 },
                order: [['payment_date', 'ASC'], ['created_at', 'ASC']],
            });
            return responseHandler.returnSuccess(httpStatus.OK, 'Payments fetched', rows);
        } catch (e) {
            logger.error(e);
            return responseHandler.returnError(httpStatus.BAD_GATEWAY, 'Failed to fetch payments');
        }
    }

    // ── Create one installment row ───────────────────────────────────────────
    async create(body, userId) {
        try {
            const { share_transaction_id, payment_date, cash_paid, oc_paid, no_consideration } = body;

            if (!share_transaction_id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'share_transaction_id is required');
            if (!payment_date)         return responseHandler.returnError(httpStatus.BAD_REQUEST, 'payment_date is required');

            const cashAmt = parseFloat(cash_paid)    || 0;
            const ocAmt   = parseFloat(oc_paid)      || 0;
            const noConsid = no_consideration ? 1 : 0;

            if (cashAmt <= 0 && ocAmt <= 0 && !noConsid) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'At least one consideration value is required');
            }

            const txn = await this.txnDao.Model.findOne({ where: { share_transaction_id, is_deleted: 0 } });
            if (!txn) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Transaction not found');

            const payType = cashAmt > 0 ? 'CASH' : ocAmt > 0 ? 'OTHERWISE_THAN_CASH' : 'NO_CONSIDERATION';

            await this.paymentDao.create({
                entity_id:            txn.entity_id,
                share_transaction_id: Number(share_transaction_id),
                share_set_id:         uuidv4(),
                payment_type:         payType,
                cash:                 cashAmt || null,
                otherwise_cash:       ocAmt   || null,
                no_consideration:     noConsid,
                payment_date:         payment_date || null,
                is_deleted:           0,
                created_by:           userId || null,
                updated_by:           userId || null,
            });

            return responseHandler.returnSuccess(httpStatus.CREATED, 'Payment saved successfully');
        } catch (e) {
            logger.error(e);
            return responseHandler.returnError(httpStatus.BAD_GATEWAY, 'Failed to save payment');
        }
    }

    // ── Update an existing installment row ───────────────────────────────────
    async update(id, body, userId) {
        try {
            const row = await this.paymentDao.Model.findOne({ where: { id, is_deleted: 0 } });
            if (!row) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Payment not found');

            const cashAmt = body.cash_paid   != null ? (parseFloat(body.cash_paid)  || 0) : Number(row.cash            || 0);
            const ocAmt   = body.oc_paid     != null ? (parseFloat(body.oc_paid)    || 0) : Number(row.otherwise_cash  || 0);
            const noConsid = body.no_consideration != null ? (body.no_consideration ? 1 : 0) : row.no_consideration;
            const payType  = cashAmt > 0 ? 'CASH' : ocAmt > 0 ? 'OTHERWISE_THAN_CASH' : 'NO_CONSIDERATION';

            await this.paymentDao.Model.update({
                payment_type:   payType,
                cash:           cashAmt || null,
                otherwise_cash: ocAmt   || null,
                no_consideration: noConsid,
                payment_date:   body.payment_date || row.payment_date,
                updated_by:     userId || null,
            }, { where: { id } });

            return responseHandler.returnSuccess(httpStatus.OK, 'Payment updated');
        } catch (e) {
            logger.error(e);
            return responseHandler.returnError(httpStatus.BAD_GATEWAY, 'Failed to update payment');
        }
    }

    // ── Toggle instalment flag on transaction ────────────────────────────────
    async updateInstalment(txn_id, has_instalment, userId) {
        try {
            const txn = await this.txnDao.Model.findOne({ where: { share_transaction_id: txn_id, is_deleted: 0 } });
            if (!txn) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Transaction not found');

            await this.txnDao.Model.update({
                is_partially_paid: has_instalment === 'YES' ? 1 : 0,
                updated_by: userId || null,
            }, { where: { share_transaction_id: txn_id } });

            return responseHandler.returnSuccess(httpStatus.OK, 'Instalment setting updated');
        } catch (e) {
            logger.error(e);
            return responseHandler.returnError(httpStatus.BAD_GATEWAY, 'Failed to update instalment setting');
        }
    }

    // ── Soft-delete ──────────────────────────────────────────────────────────
    async delete(id, userId) {
        try {
            const row = await this.paymentDao.Model.findOne({ where: { id, is_deleted: 0 } });
            if (!row) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Payment not found');

            await this.paymentDao.Model.update(
                { is_deleted: 1, updated_by: userId || null },
                { where: { id } }
            );
            return responseHandler.returnSuccess(httpStatus.OK, 'Payment deleted');
        } catch (e) {
            logger.error(e);
            return responseHandler.returnError(httpStatus.BAD_GATEWAY, 'Failed to delete payment');
        }
    }
}

module.exports = SharePaymentService;
