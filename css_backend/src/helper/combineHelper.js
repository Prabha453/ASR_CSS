'use strict';

/**
 * Resolve all combine-holdings context for a single transfer operation.
 *
 * Does the three DB look-ups needed to determine combine state and returns
 * a context object whose flags can be destructured directly into the caller's
 * scope — the same variable names that were previously inline in createShareTransfer.
 *
 * @param {object} opts
 * @param {object}      opts.txnModel              - this.txnDao.Model (Sequelize model)
 * @param {number}      opts.source_txn_id          - ID of the source cert being transferred
 * @param {object}      opts.sourceTxn              - raw source transaction row
 * @param {number}      opts.perSh                  - per_share of the source cert
 * @param {string|number} opts.transferee_entity_id - official_entity_id of the transferee
 * @param {any}         opts.transferor_combine      - truthy if transferor wants combine
 * @param {number}      opts.transferor_combine_txn_id
 * @param {any}         opts.transferee_combine      - truthy if transferee wants combine
 * @param {number}      opts.transferee_combine_txn_id
 *
 * @returns {Promise<{
 *   isTorCombine: boolean,
 *   isTeeCombine: boolean,
 *   isTorCombineBase: boolean,
 *   isTorCombineSec: boolean,
 *   combineOutRow: object|null,
 *   teeCombineTxn: object|null,
 *   existingCombinedInRow: object|null,
 *   teeFirstCombine: boolean,
 *   teeSubsCombine: boolean,
 * }>}
 */
async function resolveCombineContext({
    txnModel,
    source_txn_id,
    sourceTxn,
    perSh,
    transferee_entity_id,
    transferor_combine,
    transferor_combine_txn_id,
    transferee_combine,
    transferee_combine_txn_id,
}) {
    const isTorCombine     = !!(Number(transferor_combine) && transferor_combine_txn_id);
    const isTeeCombine     = !!(Number(transferee_combine) && transferee_combine_txn_id);
    const isTorCombineBase = isTorCombine && String(source_txn_id) === String(transferor_combine_txn_id);
    const isTorCombineSec  = isTorCombine && !isTorCombineBase;

    // Transferor secondary combine: find the combine-base OUT (NONE) row that was created
    // when the base cert was processed, so we can accumulate this source's balance into it.
    let combineOutRow = null;
    if (isTorCombineSec) {
        combineOutRow = await txnModel.findOne({
            where: {
                combine_share_id:   Number(transferor_combine_txn_id),
                official_entity_id: sourceTxn.official_entity_id,
                per_share:          Number(sourceTxn.per_share || 0),
                transaction_status: 'NONE',
                status:             'VALID',
                is_deleted:         0,
            },
            raw: true,
        });
    }

    // Transferee first combine: find the target existing IN holding to absorb.
    let teeCombineTxn = null;
    if (isTeeCombine) {
        teeCombineTxn = await txnModel.findOne({
            where: { share_transaction_id: Number(transferee_combine_txn_id), status: 'VALID', is_deleted: 0 },
            raw: true,
        });
    }

    // Transferee subsequent combine: no original holding left; find the previously
    // created combined IN row to accumulate further qty into.
    let existingCombinedInRow = null;
    if (isTeeCombine && !teeCombineTxn) {
        existingCombinedInRow = await txnModel.findOne({
            where: {
                combine_share_id:   Number(transferee_combine_txn_id),
                official_entity_id: transferee_entity_id,
                transaction_status: 'IN',
                status:             'VALID',
                is_deleted:         0,
            },
            raw: true,
        });
    }

    // Per-share must match for combine to apply (prevents merging different price lots)
    const teeFirstCombine = isTeeCombine && !!teeCombineTxn        && Number(teeCombineTxn.per_share)        === perSh;
    const teeSubsCombine  = isTeeCombine && !!existingCombinedInRow && Number(existingCombinedInRow.per_share) === perSh;

    return {
        isTorCombine,
        isTeeCombine,
        isTorCombineBase,
        isTorCombineSec,
        combineOutRow,
        teeCombineTxn,
        existingCombinedInRow,
        teeFirstCombine,
        teeSubsCombine,
    };
}

/**
 * Build the post-creation update promises for combine-holdings logic.
 *
 * Returns an array of Sequelize update promises that should be spread into
 * the caller's postUpdates array and awaited with Promise.all.
 *
 * @param {object} opts
 * @param {object}      opts.txnModel              - this.txnDao.Model
 * @param {object}      opts.ctx                   - result of resolveCombineContext()
 * @param {number}      opts.balanceQty            - shares the transferor keeps
 * @param {number}      opts.balanceIssued         - issued capital for balance
 * @param {number}      opts.torCash               - transferor cash consideration
 * @param {number}      opts.torOC                 - transferor otherwise-cash
 * @param {number}      opts.transferee_combine_txn_id
 * @param {number}      opts.qty                   - shares being transferred
 * @param {number}      opts.issued                - issued capital for transferred qty
 * @param {number}      opts.tcCash                - transferee cash consideration
 * @param {number}      opts.tcOC                  - transferee otherwise-cash
 * @returns {Array}  array of Sequelize update promises
 */
function buildCombinePostUpdates({
    txnModel,
    ctx,
    balanceQty,
    balanceIssued,
    torCash,
    torOC,
    transferee_combine_txn_id,
    qty,
    issued,
    tcCash,
    tcOC,
}) {
    const { isTorCombineSec, combineOutRow, teeFirstCombine, teeSubsCombine, existingCombinedInRow } = ctx;
    const updates = [];

    // Transferor secondary: accumulate this source's balance into the combine-base OUT row
    if (isTorCombineSec && combineOutRow && balanceQty > 0) {
        const newCash = Number(combineOutRow.cash             || 0) + torCash;
        const newOC   = Number(combineOutRow.otherwise_cash   || 0) + torOC;
        updates.push(
            txnModel.update({
                no_of_shares:                Number(combineOutRow.no_of_shares)         + balanceQty,
                issued_share_capital:         Number(combineOutRow.issued_share_capital) + balanceIssued,
                paidup_share_capital:         Number(combineOutRow.paidup_share_capital) + balanceIssued,
                cash:                         newCash || null,
                otherwise_cash:               newOC   || null,
                transactional_consideration:  (newCash + newOC) || null,
            }, { where: { share_transaction_id: combineOutRow.share_transaction_id } })
        );
    }

    // Transferee first combine: invalidate the original existing holding that was absorbed
    if (teeFirstCombine) {
        updates.push(
            txnModel.update(
                { status: 'INVALID' },
                { where: { share_transaction_id: Number(transferee_combine_txn_id) } }
            )
        );
    }

    // Transferee subsequent combine: accumulate qty and consideration into the existing combined IN row
    if (teeSubsCombine) {
        const newTeeCash = Number(existingCombinedInRow.cash           || 0) + tcCash;
        const newTeeOC   = Number(existingCombinedInRow.otherwise_cash || 0) + tcOC;
        updates.push(
            txnModel.update({
                no_of_shares:                Number(existingCombinedInRow.no_of_shares)         + qty,
                issued_share_capital:         Number(existingCombinedInRow.issued_share_capital) + issued,
                paidup_share_capital:         Number(existingCombinedInRow.paidup_share_capital) + issued,
                cash:                         newTeeCash || null,
                otherwise_cash:               newTeeOC   || null,
                transactional_consideration:  (newTeeCash + newTeeOC) || null,
            }, { where: { share_transaction_id: existingCombinedInRow.share_transaction_id } })
        );
    }

    return updates;
}

module.exports = {
    resolveCombineContext,
    buildCombinePostUpdates,
};
