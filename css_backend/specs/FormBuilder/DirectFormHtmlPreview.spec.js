'use strict';

const { expect } = require('chai');
const DirectFormRenderService = require('../../src/service/formBuilder/DirectFormRenderService');

describe('Direct HTML form preview', () => {
    it('renders the current form and shortcode without creating a generation record', async () => {
        const emptyOne = { findOne: async () => null };
        const emptyMany = { findAll: async () => [] };
        const models = {
            form: { findOne: async () => ({
                form_name: 'Company Form',
                form_content: '<p>{{company.name}}</p>',
                popup_fields: [],
                orientation: 'landscape',
            }) },
            entities: { findOne: async () => ({ entity_id: 7, name: 'Example & Co' }) },
            form_shortcode_definition: { findAll: async () => [{
                shortcode_key: 'company.name',
                resolver_name: 'ENTITY_FIELD',
                resolver_path: 'entity.name',
                aliases: [],
            }] },
            form_shortcode_alias: {},
            entity_company_details: emptyOne,
            entity_identification: emptyOne,
            entity_address: emptyOne,
            entity_contact: emptyOne,
            officials: emptyMany,
            entity_shares: emptyMany,
        };

        const result = await new DirectFormRenderService(models).render(4, {
            entity_id: 7, popup_values: {},
        }, 'HTML');

        expect(result.mimeType).to.equal('text/html; charset=utf-8');
        expect(result.html).to.include(
            '<p><span class="form-shortcode-highlight" style="background-color:#ffeb3b;color:inherit;">'
            + 'Example &amp; Co</span></p>'
        );
        expect(result.html).to.include('@page { size: A4 landscape;');
        expect(result).not.to.have.property('buffer');
    });

    it('maps company-share scalars and shareholder-share loops from their popup selections', async () => {
        const emptyOne = { findOne: async () => null };
        const companyShare = {
            id: 'S1', currency: 'SGD', number_of_shares: 1000,
            paid_up_capital: 1000, per_share: 1,
            share_class: { sc_name: 'Ordinary' },
        };
        const ledgerRows = [
            { id: 'L1', official_entity_id: 501, currency: 'SGD', balance_after_qty: 600, share_cert_no: 'SC-1' },
            { id: 'L2', official_entity_id: 502, currency: 'SGD', balance_after_qty: 400, share_cert_no: 'SC-2' },
        ];
        const definitions = [
            { shortcode_key: 'company.name', source_domain: 'COMPANY', resolver_name: 'ENTITY_FIELD', resolver_path: 'entity.name' },
            { shortcode_key: 'share.currency', source_domain: 'SHARE', resolver_name: 'SHARE_DETAIL', resolver_path: 'share_detail.currency' },
            { shortcode_key: 'share.number_of_shares_in_words', source_domain: 'SHARE', resolver_name: 'SHARE_DETAIL', resolver_path: 'share_detail.number_of_shares_in_words' },
            { shortcode_key: 'share.shareholder_name', source_domain: 'SHARE', resolver_name: 'SHARE_DETAIL', resolver_path: 'share_detail.shareholder_name' },
            { shortcode_key: 'share.share_certificate_number', source_domain: 'SHARE', resolver_name: 'SHARE_DETAIL', resolver_path: 'share_detail.share_certificate_number' },
        ].map(item => ({ ...item, aliases: [] }));
        const models = {
            form: { findOne: async () => ({
                form_name: 'Share Mapping Form',
                form_content: '<p>{{company.name}}</p>'
                    + '<p>{{company_share##share.currency}} - {{company_share##share.number_of_shares_in_words}}</p>'
                    + '<p>{{#choose_shares##shareholder_shares}}'
                    + '{{choose_shares##share.shareholder_name}} - '
                    + '{{choose_shares##share.share_certificate_number}}&lt;br&gt;'
                    + '{{/choose_shares##shareholder_shares}}</p>',
                popup_fields: [{ section_name: 'Shares', rows: [
                    {
                        form_pop_up_field_slug: 'company_share', pop_up_field_label_name: 'Company Share',
                        value_source: 'SHARES', source_filter_1: 'COMPANY_LEVEL_SHARES',
                    },
                    {
                        form_pop_up_field_slug: 'choose_shares', pop_up_field_label_name: 'Choose Shares',
                        value_source: 'SHARES', source_filter_1: 'SHAREHOLDER_LEVEL_SHARES',
                        depends_on: ['company_share'], multiple: true,
                    },
                ] }],
            }) },
            entities: {
                findOne: async () => ({ entity_id: 7, name: 'Example Company' }),
                findAll: async () => [
                    { entity_id: 501, name: 'Pavithra' },
                    { entity_id: 502, name: 'Nivas' },
                ],
            },
            form_shortcode_definition: { findAll: async () => definitions },
            form_shortcode_alias: {},
            entity_company_details: emptyOne,
            entity_identification: emptyOne,
            entity_address: emptyOne,
            entity_contact: emptyOne,
            officials: { findOne: async () => null, findAll: async () => [] },
            entity_shares: {
                findOne: async ({ where }) => String(where.id) === 'S1' ? companyShare : null,
                findAll: async () => [companyShare],
            },
            share_ledger: { findAll: async () => ledgerRows },
            share_class_master: {},
            shares: { findAll: async () => [] },
            transaction_type: {},
        };

        const result = await new DirectFormRenderService(models).render(7, {
            entity_id: 7,
            popup_values: { company_share: 'S1', choose_shares: ['L1', 'L2'] },
        }, 'HTML');

        expect(result.html).to.include('SGD');
        expect(result.html).to.include('One Thousand');
        expect(result.html).to.include('Pavithra');
        expect(result.html).to.match(/SC-1(?:<\/span>)?<br>/);
        expect(result.html).to.include('Nivas');
        expect(result.html).to.match(/SC-2(?:<\/span>)?<br>/);
        expect(result.html).not.to.match(/\{\{[^{}]+\}\}/);
        expect(result.html).not.to.include('&lt;br&gt;');
    });

    it('maps one director selection only into its matching individual/corporate fields', async () => {
        const emptyOne = { findOne: async () => null };
        const official = {
            official_id: 44,
            official_entity_id: 440,
            official_master_slug: 'directors',
            official_type: 'COMPANY',
            is_current: 1,
            official_entity: {
                name: 'Example Pte Ltd',
                company_type: { company_type_name: 'Private Limited Company' },
            },
            official_master: { official_master_name: 'Director' },
            date_record: { appointment_date: '2025-01-01' },
        };
        const models = {
            form: { findOne: async () => ({
                form_name: 'Director Type Form',
                form_content: '<p>(a) {{director_list##official_record.name | official_type:individual}}</p>'
                    + '<p>(b) {{director_list##official_record.name | official_type:corporate}}</p>'
                    + '<p>Type: {{director_list##official_record.company_type | official_type:corporate}}</p>',
                popup_fields: [{ section_name: 'Director', rows: [{
                    form_pop_up_field_slug: 'director_list',
                    pop_up_field_label_name: 'Director List',
                    value_source: 'OFFICIAL_RECORDS',
                    source_filter_1: 'directors',
                }] }],
            }) },
            entities: { findOne: async () => ({ entity_id: 7, name: 'Example Company' }) },
            form_shortcode_definition: { findAll: async () => [
                {
                    shortcode_key: 'official_record.name',
                    source_domain: 'OFFICIAL',
                    resolver_name: 'SELECTED_OFFICIAL',
                    resolver_path: 'official_record.name',
                    aliases: [],
                },
                {
                    shortcode_key: 'official_record.company_type',
                    source_domain: 'OFFICIAL',
                    resolver_name: 'SELECTED_OFFICIAL',
                    resolver_path: 'official_record.company_type',
                    aliases: [],
                },
            ] },
            form_shortcode_alias: {},
            entity_company_details: emptyOne,
            entity_identification: emptyOne,
            entity_address: emptyOne,
            entity_contact: emptyOne,
            officials: { findAll: async () => [official], findOne: async () => official },
            entity_shares: { findAll: async () => [] },
            share_class_master: {},
            official_master: {},
            officials_date: {},
        };

        const result = await new DirectFormRenderService(models).render(8, {
            entity_id: 7,
            popup_values: { director_list: 44 },
        }, 'HTML');

        expect(result.html.match(/Example Pte Ltd/g)).to.have.length(1);
        expect(result.html).to.match(/\(a\)[\s\S]*?\(b\)[\s\S]*?Example Pte Ltd/);
        expect(result.html).to.include('Private Limited Company');
        expect(result.html).not.to.include('official_record.company_type');
    });
});
