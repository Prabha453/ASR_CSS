'use strict';

const { expect } = require('chai');
const { mapShareTransaction } = require('../../src/domain/formBuilder/shareTransactionMapping');
const { normalizePopupSchema } = require('../../src/domain/formBuilder/popupSchema');

describe('Global share-transaction form context', () => {
    it('maps transfer parties and movement totals from one tenant transaction header', () => {
        const mapped = mapShareTransaction({
            share_id: 70, share_set_id: 'TRANSFER-70', extra_type_of_transaction: 'TRANSFER',
            transaction_date: '2026-08-24',
            transactions: [
                {
                    share_transaction_id: 701, transaction_status: 'NONE', official_entity_id: 10,
                    official_entity: { name: 'Transferor' }, no_of_shares: '60', transferee_no_of_shares: '40',
                    currency: 'SGD', share_class: { sc_name: 'Ordinary' }, transactional_consideration: '50',
                },
                {
                    share_transaction_id: 702, transaction_status: 'IN', official_entity_id: 20,
                    official_entity: { name: 'Transferee' }, transferor_official_entity_id: 10,
                    no_of_shares: '40', currency: 'SGD', share_class: { sc_name: 'Ordinary' },
                    transactional_consideration: '100', is_ubo: 1,
                },
            ],
        });
        expect(mapped).to.deep.include({
            transaction_type: 'TRANSFER', total_in_quantity: 40,
            total_out_quantity: 40, total_consideration: 150,
        });
        expect(mapped.lines[1]).to.deep.include({
            party_name: 'Transferee', transferor_entity_id: 10, is_ubo: true,
        });
    });

    it('preserves the published transaction-family allowlist', () => {
        const schema = normalizePopupSchema([{ section_key: 'transaction', fields: [{
            field_key: 'transaction', value_source: 'SHARE_TRANSACTIONS', control_type: 'SELECT',
            transaction_types: ['transfer', 'BUYBACK', 'transfer'],
        }] }]);
        expect(schema[0].fields[0].transaction_types).to.deep.equal(['TRANSFER', 'BUYBACK']);
    });

    it('preserves official role and current/ceased filters for global forms', () => {
        const schema = normalizePopupSchema([{ section_key: 'official', fields: [{
            field_key: 'director', value_source: 'OFFICIAL_RECORDS', control_type: 'SELECT',
            official_roles: ['Directors'], official_statuses: ['ceased', 'invalid'],
        }] }]);
        expect(schema[0].fields[0].official_roles).to.deep.equal(['directors']);
        expect(schema[0].fields[0].official_statuses).to.deep.equal(['CEASED']);
    });
});
