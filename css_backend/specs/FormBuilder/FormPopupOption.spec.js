'use strict';

const { expect } = require('chai');
const { Op } = require('sequelize');
const FormPopupOptionService = require('../../src/service/formBuilder/FormPopupOptionService');

describe('Tenant-local popup options', () => {
    it('finds only fields declared by the published schema', () => {
        const field = FormPopupOptionService.findSchemaField([{ section_key: 'main', fields: [{
            field_key: 'shareholder', label: 'Shareholder', value_source: 'SHAREHOLDERS',
        }] }], 'shareholder');
        expect(field.value_source).to.equal('SHAREHOLDERS');
        expect(FormPopupOptionService.findSchemaField([], 'shareholder')).to.equal(undefined);
    });

    it('returns only the newest positive shareholder balance per share grouping', () => {
        const options = FormPopupOptionService.latestShareOptions([
            { id: 3, company_share_id: 7, share_class_id: 1, currency: 'SGD', share_type: 'NORMAL', balance_after_qty: 25, share_set_id: 'A' },
            { id: 2, company_share_id: 7, share_class_id: 1, currency: 'SGD', share_type: 'NORMAL', balance_after_qty: 10, share_set_id: 'A' },
            { id: 1, company_share_id: 8, share_class_id: 2, currency: 'USD', share_type: 'NORMAL', balance_after_qty: 0, share_set_id: 'B' },
        ]);
        expect(options).to.have.length(1);
        expect(options[0].value).to.equal(7);
        expect(options[0].meta.quantity).to.equal(25);
    });

    it('applies case-insensitive search and a server-side limit', () => {
        const rows = [{ label: 'Alice' }, { label: 'ALINA' }, { label: 'Bob' }];
        expect(FormPopupOptionService.applySearchAndLimit(rows, 'ali', 1)).to.deep.equal([{ label: 'Alice' }]);
    });

    it('returns stable option pages with total and continuation state', () => {
        const result = FormPopupOptionService.paginateOptions([
            { label: 'A' }, { label: 'B' }, { label: 'C' },
        ], '', 2, 2);
        expect(result.options).to.deep.equal([{ label: 'C' }]);
        expect(result.total).to.equal(3);
        expect(result.has_more).to.equal(false);
    });

    it('scopes allotment choices to valid rows for the selected company', async () => {
        let query;
        const service = new FormPopupOptionService({
            shares: { findAll: async options => {
                query = options;
                return [{
                    share_id: 9, share_set_id: 'SET-9', transaction_date: '2026-08-24',
                    transactions: [{ share_transaction_id: 91, no_of_shares: '125.000000' }],
                }];
            } },
            share_transactions: {},
        });
        const result = await service.resolveForField({ value_source: 'ALLOTMENTS' }, 42);
        expect(query.where).to.deep.equal({ entity_id: 42, status: 'VALID', is_deleted: 0 });
        expect(result.options[0]).to.deep.include({ value: 9, label: '2026-08-24 - 125 shares' });
        expect(result.options[0].meta.quantity).to.equal(125);
    });

    it('applies the published share transaction family allowlist', async () => {
        let query;
        const service = new FormPopupOptionService({
            shares: { findAll: async options => {
                query = options;
                return [{
                    share_id: 12, share_set_id: 'TX-12', transaction_date: '2026-08-24',
                    extra_type_of_transaction: 'TRANSFER', transactions: [{ share_transaction_id: 120 }],
                }];
            } },
            share_transactions: {},
        });
        const result = await service.resolveForField({
            value_source: 'SHARE_TRANSACTIONS', transaction_types: ['TRANSFER', 'BUYBACK'],
        }, 42);
        expect(query.where.entity_id).to.equal(42);
        expect(query.where.extra_type_of_transaction[Op.in]).to.deep.equal(['TRANSFER', 'BUYBACK']);
        expect(result.options[0].label).to.equal('TRANSFER - 2026-08-24 (#12)');
    });

    it('returns an empty list — not an error — for a Shareholder Level Shares field with no parent picked yet', async () => {
        const service = new FormPopupOptionService({ officials: {}, entity_shares: {} });
        const result = await service.resolveForField({
            value_source: 'SHARES', source_filter_1: 'SHAREHOLDER_LEVEL_SHARES',
        }, 42, null);
        expect(result).to.deep.equal({ options: [] });
    });

    it('returns an empty list — not an error — when the parent value resolves to nothing usable', async () => {
        const service = new FormPopupOptionService({
            officials: { findOne: async () => null },
            entity_shares: { findOne: async () => null },
        });
        const result = await service.resolveForField({
            value_source: 'SHARES', source_filter_1: 'SHAREHOLDER_LEVEL_SHARES',
        }, 42, 'does-not-exist');
        expect(result).to.deep.equal({ options: [] });
    });

    it('lists the shareholders holding a selected company-level share', async () => {
        const service = new FormPopupOptionService({
            officials: {
                findOne: async () => null,
                findAll: async () => [{ official_entity_id: 501, official_type: 'INDIVIDUAL' }],
            },
            entity_shares: { findOne: async () => ({ id: 7, entity_id: 42 }) },
            share_ledger: { findAll: async () => [
                { id: 101, official_entity_id: 501, company_share_id: 7, currency: 'SGD', share_type: 'NORMAL', balance_after_qty: 100 },
                { id: 102, official_entity_id: 502, company_share_id: 7, currency: 'SGD', share_type: 'NORMAL', balance_after_qty: 0 },
            ] },
            entities: { findAll: async () => [{ entity_id: 501, name: 'Alice Tan' }] },
        });
        const result = await service.resolveForField({
            value_source: 'SHARES', source_filter_1: 'SHAREHOLDER_LEVEL_SHARES',
        }, 42, 7);
        // The zero-balance shareholder is dropped; the value is the ledger row id.
        expect(result.options).to.have.length(1);
        expect(result.options[0]).to.deep.include({ value: 101 });
        expect(result.options[0].meta.official_type).to.equal('INDIVIDUAL');
        expect(result.options[0].label).to.include('Alice Tan');
        expect(result.options[0].meta.quantity).to.equal(100);
    });

    it('filters shareholders-of-a-share by entity type (source_filter_4)', async () => {
        const service = new FormPopupOptionService({
            officials: {
                findOne: async () => null,
                findAll: async () => [
                    { official_entity_id: 501, official_type: 'INDIVIDUAL' },
                    { official_entity_id: 502, official_type: 'COMPANY' },
                ],
            },
            entity_shares: { findOne: async () => ({ id: 7, entity_id: 42 }) },
            share_ledger: { findAll: async () => [
                { id: 101, official_entity_id: 501, company_share_id: 7, currency: 'SGD', share_type: 'NORMAL', balance_after_qty: 100 },
                { id: 102, official_entity_id: 502, company_share_id: 7, currency: 'SGD', share_type: 'NORMAL', balance_after_qty: 50 },
            ] },
            entities: { findAll: async () => [
                { entity_id: 501, name: 'Alice Tan' }, { entity_id: 502, name: 'Acme Holdings' },
            ] },
        });
        const result = await service.resolveForField({
            value_source: 'SHARES', source_filter_1: 'SHAREHOLDER_LEVEL_SHARES', source_filter_4: 'COMPANY',
        }, 42, 7);
        expect(result.options).to.have.length(1);
        expect(result.options[0].meta).to.deep.include({ shareholder_entity_id: 502, official_type: 'COMPANY' });
    });

    it('rejects a whole single-shareholder field when their type does not match source_filter_4', async () => {
        const service = new FormPopupOptionService({
            officials: { findOne: async () => ({ official_entity_id: 900, official_type: 'INDIVIDUAL' }) },
            share_ledger: {},
        });
        const result = await service.resolveForField({
            value_source: 'SHARES', source_filter_1: 'SHAREHOLDER_LEVEL_SHARES', source_filter_4: 'COMPANY',
        }, 42, 55);
        expect(result).to.deep.equal({ options: [] });
    });

    it('rebuilds option labels from the field\'s own option_label_fields setting', async () => {
        const service = new FormPopupOptionService({
            officials: { findAll: async () => [{
                official_id: 31, official_entity_id: 310, official_master_slug: 'directors',
                official_type: 'INDIVIDUAL', is_current: 1,
                official_entity: { name: 'Jane Director', client_no: 'I-81' },
                official_master: { official_master_name: 'Director' },
                date_record: { appointment_date: '2026-09-01', ceased_date: null },
            }] },
            entities: {}, official_master: {}, officials_date: {},
        });
        const result = await service.resolveForField({
            value_source: 'OFFICIAL_RECORDS', option_label_fields: ['role_name', 'name'],
        }, 42);
        expect(result.options[0].label).to.equal('Director - Jane Director');
    });

    it('leaves the default label alone when option_label_fields is empty', async () => {
        const service = new FormPopupOptionService({
            officials: { findAll: async () => [{
                official_id: 31, official_entity_id: 310, official_master_slug: 'directors',
                is_current: 1, official_entity: { name: 'Jane Director' },
                official_master: {}, date_record: {},
            }] },
            entities: {}, official_master: {}, officials_date: {},
        });
        const result = await service.resolveForField({ value_source: 'OFFICIAL_RECORDS' }, 42);
        expect(result.options[0].label).to.equal('Jane Director - directors');
    });

    it('loads ceased directors for resignation forms without event linkage', async () => {
        let query;
        const service = new FormPopupOptionService({
            officials: { findAll: async options => {
                query = options;
                return [{
                    official_id: 31, official_entity_id: 310, official_master_slug: 'directors', is_current: 0,
                    official_entity: { name: 'Jane Director' },
                    date_record: { appointment_date: '2020-01-01', ceased_date: '2026-08-24' },
                }];
            } },
            entities: {}, official_master: {}, officials_date: {},
        });
        const result = await service.resolveForField({
            value_source: 'OFFICIAL_RECORDS', official_roles: ['directors'], official_statuses: ['CEASED'],
        }, 42);
        expect(query.where.entity_id).to.equal(42);
        expect(query.where.is_current).to.equal(0);
        expect(query.where.official_master_slug[Op.in]).to.deep.equal(['directors']);
        expect(result.options[0].meta).to.deep.include({
            role: 'directors', status: 'CEASED', cessation_date: '2026-08-24',
        });
    });
});
