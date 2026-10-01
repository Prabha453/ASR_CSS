'use strict';

const { expect } = require('chai');
const { mapAllotment } = require('../../src/domain/formBuilder/shareAllotmentMapping');
const { normalizePopupSchema } = require('../../src/domain/formBuilder/popupSchema');

describe('Share Allotment generation mapping', () => {
    const mapped = mapAllotment({
        share_id: 44,
        share_set_id: 'ALLOT-44',
        transaction_date: '2026-08-24',
        transactions: [
            {
                share_transaction_id: 101,
                official_entity_id: 501,
                official_type: 'INDIVIDUAL',
                official_entity: { name: 'Alice Tan' },
                share_class_id: 1,
                share_class: { sc_name: 'Ordinary', sc_slug: 'ordinary' },
                share_type: 'NORMAL', currency: 'SGD', no_of_shares: '100.000000',
                issued_per_share: '1.25000000', issued_share_capital: '125.000000',
                paidup_share_capital: '100.000000', cash: '80.000000', otherwise_cash: '20.000000',
                transactional_consideration: '100.000000', no_consideration: 0,
            },
            {
                share_transaction_id: 102,
                official_entity_id: 502,
                official_type: 'CORPORATE',
                official_entity: { name: 'Holdings Pte Ltd' },
                share_class_id: 1,
                share_class: { sc_name: 'Ordinary', sc_slug: 'ordinary' },
                share_type: 'NORMAL', currency: 'SGD', no_of_shares: '50.000000',
                issued_per_share: '1.25000000', issued_share_capital: '62.500000',
                paidup_share_capital: '0', cash: null, otherwise_cash: null,
                transactional_consideration: null, no_consideration: 1,
            },
        ],
    });

    it('maps stable repeating allottee and share fields', () => {
        expect(mapped.allottees).to.have.length(2);
        expect(mapped.allottees[0]).to.deep.include({
            allottee_name: 'Alice Tan', share_class_name: 'Ordinary', quantity: 100,
            issue_price: 1.25, total_consideration: 100,
        });
        expect(mapped.allottees[1]).to.deep.include({
            allottee_name: 'Holdings Pte Ltd', no_consideration: true, total_consideration: 0,
        });
    });

    it('calculates totals from trusted transaction rows', () => {
        expect(mapped).to.deep.include({
            currency: 'SGD', total_quantity: 150, total_issued_capital: 187.5,
            total_paid_up_capital: 100, total_consideration: 100,
        });
    });

    it('preserves ALLOTMENTS as a remote published popup source', () => {
        const schema = normalizePopupSchema([{ section_key: 'shares', fields: [{
            field_key: 'selected_allotment', control_type: 'SELECT', value_source: 'ALLOTMENTS', required: true,
        }] }]);
        expect(schema[0].fields[0].value_source).to.equal('ALLOTMENTS');
    });
});
