'use strict';

const { v4: uuidv4 } = require('uuid');
const { Op }         = require('sequelize');

/**
 * Group source transactions by their parent cs_entity_shares (company_share_id),
 * load the current entity_shares records, and return:
 *   snapshot     — current DB state of each affected row (used to restore on retain)
 *   reductionMap — { [esId]: { shares, issued, paidup } } to subtract on commit
 *
 * @param {object[]} sourceTxns  - raw transaction rows (must have company_share_id,
 *                                  no_of_shares, issued_share_capital, paidup_share_capital)
 * @param {object}   models      - getCurrentModels() result
 * @returns {{ snapshot: object[], reductionMap: object }}
 */
async function buildSourceESContext(sourceTxns, models) {
    const reductionMap = {};
    for (const t of sourceTxns) {
        const k = String(t.company_share_id);
        if (!reductionMap[k]) reductionMap[k] = { shares: 0, issued: 0, paidup: 0 };
        reductionMap[k].shares += Number(t.no_of_shares         || 0);
        reductionMap[k].issued += Number(t.issued_share_capital || 0);
        reductionMap[k].paidup += Number(t.paidup_share_capital || 0);
    }
    const csIds    = Object.keys(reductionMap).map(Number);
    const snapshot = await models.entity_shares.findAll({
        where: { id: { [Op.in]: csIds }, is_deleted: 0 },
        raw: true,
    });
    return { snapshot, reductionMap };
}

/**
 * Format a snapshot array for storage in old_data.source_es_snapshot.
 * Call this BEFORE the operation commits any changes so the values are the
 * pre-operation state.
 *
 * @param {object[]} snapshot - from buildSourceESContext().snapshot
 * @returns {object[]}
 */
function buildESSnapshotForOldData(snapshot) {
    return snapshot.map(r => ({
        id:                       r.id,
        number_of_shares:         r.number_of_shares,
        authorized_share_capital: r.authorized_share_capital,
        issued_share_capital:     r.issued_share_capital,
        paid_up_capital:          r.paid_up_capital,
        per_share:                r.per_share,
        issued_per_share:         r.issued_per_share,
        is_deleted:               r.is_deleted,
    }));
}

/**
 * Create one cs_entity_shares entry plus its entity_share_history record.
 * Returns the created Sequelize instance (caller needs .id).
 *
 * @param {object} opts
 * @param {object} opts.models
 * @param {number} opts.entity_id
 * @param {string} opts.currency
 * @param {number} opts.share_class_id
 * @param {string} opts.share_type      'NORMAL' | 'BONUS' | 'GUARANTEE'
 * @param {number} opts.shares          number of shares
 * @param {number} opts.issued          issued share capital
 * @param {number} opts.paidup          paid-up capital
 * @param {number} opts.perShare        paid-up per share
 * @param {number} [opts.issuedPerShare] issued per share (defaults to perShare)
 * @param {string} opts.date            transaction date
 * @param {string} opts.txnType         stored in entity_share_history.transaction_type
 * @param {string} [opts.remarks]       optional note on the history row
 * @param {number|null} opts.userId
 * @returns {Promise<object>}           created entity_shares instance
 */
async function createEntityShareEntry({
    models, entity_id, currency, share_class_id, share_type,
    shares, issued, paidup, perShare, issuedPerShare,
    date, txnType, remarks, userId,
}) {
    const setId    = uuidv4();
    const issuedPS = issuedPerShare ?? perShare;

    const entry = await models.entity_shares.create({
        entity_id,
        currency,
        share_class_id,
        share_type:               share_type || 'NORMAL',
        number_of_shares:         shares,
        authorized_share_capital: issued,
        issued_share_capital:     issued,
        paid_up_capital:          paidup,
        per_share:                perShare,
        issued_per_share:         issuedPS,
        guarantee_amount:         null,
        date_of_transaction:      date,
        source_from:              'MANUAL',
        is_workflow:              0,
        is_acra:                  0,
        is_vot:                   0,
        is_deleted:               0,
        share_set_id:             setId,
        created_by:               userId || null,
        updated_by:               userId || null,
    });

    await models.entity_share_history.create({
        entity_shares_id:         entry.id,
        entity_id,
        transaction_type:         txnType || 'manual',
        currency,
        share_class_id,
        share_type:               share_type || 'NORMAL',
        number_of_shares:         shares,
        authorized_share_capital: issued,
        issued_share_capital:     issued,
        paid_up_capital:          paidup,
        per_share:                perShare,
        issued_per_share:         issuedPS,
        guarantee_amount:         null,
        delta_shares:             null,
        delta_authorized_capital: null,
        delta_issued_capital:     null,
        delta_paid_capital:       null,
        delta_guarantee_amount:   null,
        date_of_transaction:      date,
        source_from:              'MANUAL',
        is_workflow:              0,
        is_acra:                  0,
        is_vot:                   0,
        share_set_id:             setId,
        remarks:                  remarks || null,
        created_by:               userId || null,
    });

    return entry;
}

/**
 * Reduce or soft-delete source entity_shares records after a share operation
 * removes some shares from them.  Runs all updates in parallel (different rows,
 * no deadlock risk).
 *
 * @param {object[]} snapshot      from buildSourceESContext().snapshot
 * @param {object}   reductionMap  from buildSourceESContext().reductionMap
 * @param {number|null} userId
 * @param {object}   models
 */
async function reduceEntityShares({ snapshot, reductionMap, userId, models }) {
    await Promise.all(snapshot.map(esRec => {
        const removed   = reductionMap[String(esRec.id)] || { shares: 0, issued: 0, paidup: 0 };
        const newShares = esRec.number_of_shares         - removed.shares;
        const newIssued = esRec.issued_share_capital     - removed.issued;
        const newPaidup = esRec.paid_up_capital          - removed.paidup;
        const newAuth   = Math.max(0, esRec.authorized_share_capital - removed.issued);

        if (newShares <= 0) {
            return models.entity_shares.update(
                { is_deleted: 1, updated_by: userId },
                { where: { id: esRec.id } }
            );
        }
        return models.entity_shares.update({
            number_of_shares:         newShares,
            authorized_share_capital: newAuth,
            issued_share_capital:     newIssued,
            paid_up_capital:          newPaidup,
            per_share:                newShares > 0 ? newPaidup / newShares : 0,
            issued_per_share:         newShares > 0 ? newIssued / newShares : 0,
            updated_by:               userId,
        }, { where: { id: esRec.id } });
    }));
}

/**
 * Soft-delete a list of entity_shares entries.
 * Called during retain/reversal to remove the entries the original operation created.
 *
 * @param {number[]}    esIds
 * @param {number|null} userId
 * @param {object}      models
 */
async function deleteEntityShares(esIds, userId, models) {
    if (!esIds || esIds.length === 0) return;
    await models.entity_shares.update(
        { is_deleted: 1, updated_by: userId },
        { where: { id: { [Op.in]: esIds } } }
    );
}

/**
 * Restore entity_shares rows from a snapshot (used by retain / reversal).
 * Each snap must contain: id, number_of_shares, authorized_share_capital,
 * issued_share_capital, paid_up_capital, per_share, issued_per_share, is_deleted.
 *
 * @param {object[]}    snapshot
 * @param {number|null} userId
 * @param {object}      models
 */
async function restoreEntitySharesSnapshot(snapshot, userId, models) {
    if (!Array.isArray(snapshot) || snapshot.length === 0) return;
    await Promise.all(snapshot.map(snap =>
        models.entity_shares.update({
            number_of_shares:         snap.number_of_shares,
            authorized_share_capital: snap.authorized_share_capital,
            issued_share_capital:     snap.issued_share_capital,
            paid_up_capital:          snap.paid_up_capital,
            per_share:                snap.per_share,
            issued_per_share:         snap.issued_per_share,
            is_deleted:               snap.is_deleted || 0,
            updated_by:               userId,
        }, { where: { id: snap.id } })
    ));
}

module.exports = {
    buildSourceESContext,
    buildESSnapshotForOldData,
    createEntityShareEntry,
    reduceEntityShares,
    deleteEntityShares,
    restoreEntitySharesSnapshot,
};
