'use strict';

const plain = row => row?.toJSON ? row.toJSON() : row;
const number = value => Number(value || 0);

const mapShareTransaction = source => {
    const header = plain(source) || {};
    const lines = (header.transactions || []).map(item => {
        const row = plain(item) || {};
        const party = plain(row.official_entity) || {};
        const shareClass = plain(row.share_class) || {};
        const transactionStatus = row.transaction_status;
        const movementIn = transactionStatus === 'IN' ? number(row.no_of_shares) : 0;
        const movementOut = transactionStatus === 'OUT'
            ? number(row.no_of_shares)
            : transactionStatus === 'NONE' ? number(row.transferee_no_of_shares) : 0;
        return {
            share_transaction_id: row.share_transaction_id,
            transaction_status: transactionStatus,
            party_entity_id: row.official_entity_id,
            party_name: party.name || null,
            party_type: row.official_type || party.entity_type || null,
            transferor_entity_id: row.transferor_official_entity_id || null,
            transferee_entity_id: row.transferee_official_entity_id || null,
            share_class_id: row.share_class_id,
            share_class_name: shareClass.sc_name || null,
            share_type: row.share_type,
            currency: row.currency,
            quantity: number(row.no_of_shares),
            movement_in_quantity: movementIn,
            movement_out_quantity: movementOut,
            issue_price: number(row.issued_per_share || row.per_share),
            issued_capital: number(row.issued_share_capital),
            paid_up_capital: number(row.paidup_share_capital),
            consideration: row.no_consideration ? 0 : number(row.transactional_consideration),
            no_consideration: Boolean(row.no_consideration),
            is_ubo: Boolean(row.is_ubo),
            transaction_number: row.transaction_no || null,
            folio_number: row.folio_no || null,
            certificate_number: row.share_cert_no || null,
        };
    });
    return {
        share_id: header.share_id,
        share_set_id: header.share_set_id,
        transaction_type: String(header.extra_type_of_transaction || '').toUpperCase() || null,
        transaction_date: header.transaction_date || null,
        remarks: header.remarks || null,
        lines,
        total_in_quantity: lines.reduce((sum, line) => sum + line.movement_in_quantity, 0),
        total_out_quantity: lines.reduce((sum, line) => sum + line.movement_out_quantity, 0),
        total_consideration: lines.reduce((sum, line) => sum + line.consideration, 0),
    };
};

module.exports = { mapShareTransaction };
