'use strict';

const { expect } = require('chai');
const { normalizePopupSchema, validatePopupSchema, mergePopupSchemas } = require('../../src/domain/formBuilder/popupSchema');

describe('Versioned popup schema', () => {
    it('normalizes legacy popup rows into the reusable schema', () => {
        const schema = normalizePopupSchema({ section_0: [{
            section_name: 'Share details',
            form_pop_up_field_slug: 'Shareholder',
            pop_up_field_label_name: 'Select shareholder',
        }] });
        expect(schema[0].section_key).to.equal('share_details');
        expect(schema[0].fields[0].field_key).to.equal('shareholder');
        expect(schema[0].fields[0].control_type).to.equal('TEXT');
    });

    it('passes through source_filter_4 (SHARES shareholder entity type)', () => {
        const schema = normalizePopupSchema([{ section_key: 'shares', fields: [
            { field_key: 'choose_shares', value_source: 'SHARES', source_filter_1: 'SHAREHOLDER_LEVEL_SHARES', source_filter_4: 'COMPANY,JOINT' },
            { field_key: 'company_shares', value_source: 'SHARES', source_filter_1: 'COMPANY_LEVEL_SHARES' },
        ] }]);
        expect(schema[0].fields[0].source_filter_4).to.equal('COMPANY,JOINT');
        expect(schema[0].fields[1].source_filter_4).to.equal('all');
    });

    it('passes through option_label_fields, deduped and lower-cased', () => {
        const schema = normalizePopupSchema([{ section_key: 'officials', fields: [
            { field_key: 'director_1', value_source: 'OFFICIAL_RECORDS', option_label_fields: ['Role_Name', 'name', 'name'] },
            { field_key: 'director_2', value_source: 'OFFICIAL_RECORDS' },
        ] }]);
        expect(schema[0].fields[0].option_label_fields).to.deep.equal(['role_name', 'name']);
        expect(schema[0].fields[1].option_label_fields).to.deep.equal([]);
    });

    it('accepts an acyclic parent-child dependency', () => {
        expect(validatePopupSchema([{ section_key: 'shares', label: 'Shares', fields: [
            { field_key: 'shareholder', label: 'Shareholder', control_type: 'SHAREHOLDER_SELECT', value_source: 'SHAREHOLDERS' },
            { field_key: 'shares', label: 'Shares', control_type: 'SHARE_SELECT', value_source: 'SHARES', depends_on: ['shareholder'] },
        ] }])).to.deep.equal([]);
    });

    it('defaults a Shareholder-Level-Shares field\'s dependency from child_of when unset', () => {
        const schema = normalizePopupSchema([{ section_key: 'shares', fields: [
            { field_key: 'company_level_share_list', value_source: 'SHARES', source_filter_1: 'COMPANY_LEVEL_SHARES' },
            {
                field_key: 'choose_shares', value_source: 'SHARES', source_filter_1: 'SHAREHOLDER_LEVEL_SHARES',
                child_of: 'company_level_share_list',
            },
        ] }]);
        expect(schema[0].fields[1].depends_on).to.deep.equal(['company_level_share_list']);
    });

    it('leaves depends_on alone when the author already set it, even with child_of present', () => {
        const schema = normalizePopupSchema([{ section_key: 'shares', fields: [
            {
                field_key: 'choose_shares', value_source: 'SHARES', source_filter_1: 'SHAREHOLDER_LEVEL_SHARES',
                child_of: 'company_level_share_list', depends_on: ['some_other_field'],
            },
        ] }]);
        expect(schema[0].fields[0].depends_on).to.deep.equal(['some_other_field']);
    });

    it('does not default a dependency from child_of for other data sources', () => {
        const schema = normalizePopupSchema([{ section_key: 'officials', fields: [
            { field_key: 'director_1', value_source: 'OFFICIAL_RECORDS', child_of: 'shareholder_1' },
        ] }]);
        expect(schema[0].fields[0].depends_on).to.deep.equal([]);
    });

    it('rejects missing, duplicate, and circular dependencies', () => {
        const errors = validatePopupSchema([{ section_key: 'main', label: 'Main', fields: [
            { field_key: 'a', label: 'A', depends_on: ['b'] },
            { field_key: 'b', label: 'B', depends_on: ['a'] },
            { field_key: 'a', label: 'Again', depends_on: ['missing'] },
        ] }]);
        expect(errors.some(error => error.includes('Duplicate field key'))).to.equal(true);
        expect(errors.some(error => error.includes('Unknown dependency'))).to.equal(true);
        expect(errors.some(error => error.includes('Circular dependency'))).to.equal(true);
    });

    it('merges matching fields once and retains their source forms', () => {
        const merged = mergePopupSchemas([1, 2].map(form_id => ({ form_id, schema: [{
            section_key: 'main', label: 'Main', fields: [{
                field_key: 'event', label: 'Event', control_type: 'EVENT_SELECT', value_source: 'EVENT', required: form_id === 2,
            }],
        }] })));
        expect(merged.conflicts).to.deep.equal([]);
        expect(merged.schema[0].fields).to.have.length(1);
        expect(merged.schema[0].fields[0].origin_form_ids).to.deep.equal([1, 2]);
        expect(merged.schema[0].fields[0].required).to.equal(true);
    });

    it('rejects incompatible controls that reuse a field key', () => {
        const merged = mergePopupSchemas([
            { form_id: 1, schema: [{ section_key: 'main', fields: [{ field_key: 'party', control_type: 'TEXT' }] }] },
            { form_id: 2, schema: [{ section_key: 'main', fields: [{ field_key: 'party', control_type: 'DATE' }] }] },
        ]);
        expect(merged.conflicts[0]).to.include('Conflicting field definition');
    });
});
