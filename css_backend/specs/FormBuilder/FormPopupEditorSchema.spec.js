'use strict';

const { expect } = require('chai');
const FormService = require('../../src/service/formBuilder/FormService');
const { normalizePopupSchema } = require('../../src/domain/formBuilder/popupSchema');

describe('Global form popup editor schema persistence', () => {
    it('round-trips modern source filters while preserving legacy fields', () => {
        const stored = FormService.buildPopupFields([{
            section_name: 'Transaction',
            rows: [{
                pop_up_field_id: 5,
                pop_up_field_type: '1',
                pop_up_temp_param: '',
                pop_up_field_label_name: 'Transaction',
                form_pop_up_field_slug: 'transaction',
                control_type: 'SELECT',
                value_source: 'SHARE_TRANSACTIONS',
                required: true,
                transaction_types: ['TRANSFER', 'BUYBACK'],
                official_roles: [], official_statuses: [], depends_on: [], multiple: false,
            }],
        }]);
        const restored = FormService.deserializePopupFields(stored);
        expect(restored[0]).to.have.property('_id');
        expect(restored[0].rows[0]).to.deep.include({
            pop_up_field_type: '1', control_type: 'SELECT',
            value_source: 'SHARE_TRANSACTIONS', required: true,
        });
        expect(restored[0].rows[0].transaction_types).to.deep.equal(['TRANSFER', 'BUYBACK']);
        const normalized = normalizePopupSchema(restored);
        expect(normalized[0].fields[0]).to.deep.include({
            control_type: 'SELECT', value_source: 'SHARE_TRANSACTIONS', required: true,
        });
    });

    it('round-trips official role and status filters', () => {
        const restored = FormService.deserializePopupFields(FormService.buildPopupFields([{
            section_name: 'Director',
            rows: [{
                form_pop_up_field_slug: 'director', control_type: 'SELECT', value_source: 'OFFICIAL_RECORDS',
                official_roles: ['directors'], official_statuses: ['CEASED'], required: true,
            }],
        }]));
        expect(restored[0].rows[0].official_roles).to.deep.equal(['directors']);
        expect(restored[0].rows[0].official_statuses).to.deep.equal(['CEASED']);
    });
});
