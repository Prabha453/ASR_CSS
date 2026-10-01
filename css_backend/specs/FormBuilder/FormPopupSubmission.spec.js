'use strict';

const { expect } = require('chai');
const FormPopupSubmissionService = require('../../src/service/formBuilder/FormPopupSubmissionService');

describe('Popup submission validation', () => {
    it('validates number, date, multiplicity, and published static options', () => {
        const validate = FormPopupSubmissionService.validateLocalValue;
        expect(validate({ control_type: 'NUMBER', multiple: false, options: [] }, 'abc')).to.include('number');
        expect(validate({ control_type: 'DATE', multiple: false, options: [] }, '24-08-2026')).to.include('YYYY-MM-DD');
        expect(validate({ control_type: 'SELECT', multiple: false, options: [{ value: 'A' }] }, 'B')).to.include('published');
        expect(validate({ control_type: 'MULTISELECT', multiple: true, options: [] }, ['A'])).to.equal(null);
    });

    it('rejects unknown fields, missing dependencies, and stale remote IDs', async () => {
        const service = new FormPopupSubmissionService({});
        service.optionService.resolveForField = async () => ({ options: [{ value: 10, label: 'Current' }] });
        const result = await service.validateVersion({ popup_schema: [{
            section_key: 'shares', label: 'Shares', fields: [
                { field_key: 'shareholder', label: 'Shareholder', control_type: 'SHAREHOLDER_SELECT', value_source: 'SHAREHOLDERS', required: true },
                { field_key: 'shares', label: 'Shares', control_type: 'SHARE_SELECT', value_source: 'SHARES', depends_on: ['shareholder'] },
            ],
        }] }, 5, { unknown: 1, shareholder: 99, shares: 20 });

        expect(result.valid).to.equal(false);
        expect(result.errors.map(error => error.code)).to.include.members(['UNKNOWN_FIELD', 'STALE_OR_UNAUTHORIZED']);
    });

    it('requires a parent value before validating a dependent selection', async () => {
        const service = new FormPopupSubmissionService({});
        const result = await service.validateVersion({ popup_schema: [{
            section_key: 'shares', label: 'Shares', fields: [{
                field_key: 'shares', label: 'Shares', control_type: 'SHARE_SELECT',
                value_source: 'SHARES', depends_on: ['shareholder'],
            }],
        }] }, 5, { shares: 20 });
        expect(result.errors[0].code).to.equal('MISSING_DEPENDENCY');
    });
});
