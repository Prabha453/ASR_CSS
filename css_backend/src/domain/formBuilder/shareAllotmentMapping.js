'use strict';

const plain = row => row?.toJSON ? row.toJSON() : row;
const amount = value => Number(value || 0);

const mapAllotment = shareRow => {
    const share = plain(shareRow) || {};
    const lines = (share.transactions || []).map(source => {
        const row = plain(source) || {};
        const allottee = plain(row.official_entity) || {};
        const shareClass = plain(row.share_class) || {};
        const quantity = amount(row.no_of_shares);
        const issuePrice = amount(row.issued_per_share || row.per_share);
        const cash = amount(row.cash);
        const otherwiseCash = amount(row.otherwise_cash);
        return {
            share_transaction_id: row.share_transaction_id,
            allottee_entity_id: row.official_entity_id,
            allottee_name: allottee.name || null,
            allottee_type: row.official_type || allottee.entity_type || null,
            share_class_id: row.share_class_id,
            share_class_name: shareClass.sc_name || null,
            share_class_slug: shareClass.sc_slug || null,
            share_type: row.share_type,
            currency: row.currency,
            quantity,
            issue_price: issuePrice,
            issued_capital: amount(row.issued_share_capital),
            paid_up_capital: amount(row.paidup_share_capital),
            cash_consideration: cash,
            other_consideration: otherwiseCash,
            total_consideration: row.no_consideration ? 0 : amount(row.transactional_consideration || cash + otherwiseCash),
            no_consideration: Boolean(row.no_consideration),
            transaction_number: row.transaction_no || null,
            share_certificate_number: row.share_cert_no || null,
        };
    });
    const currencies = [...new Set(lines.map(line => line.currency).filter(Boolean))];
    return {
        share_id: share.share_id,
        share_set_id: share.share_set_id,
        transaction_date: share.transaction_date,
        currency: currencies.length === 1 ? currencies[0] : currencies.length > 1 ? 'MULTIPLE' : null,
        allottees: lines,
        total_quantity: lines.reduce((sum, line) => sum + line.quantity, 0),
        total_issued_capital: lines.reduce((sum, line) => sum + line.issued_capital, 0),
        total_paid_up_capital: lines.reduce((sum, line) => sum + line.paid_up_capital, 0),
        total_consideration: lines.reduce((sum, line) => sum + line.total_consideration, 0),
    };
};

module.exports = { mapAllotment };
