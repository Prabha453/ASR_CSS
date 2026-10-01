'use strict';

const { expect } = require('chai');
const ShortcodeLibraryService = require('../../src/service/formBuilder/ShortcodeLibraryService');

describe('Shortcode Library service helpers', () => {
    it('only exposes active source domains in shortcode metadata', async () => {
        const result = await new ShortcodeLibraryService().meta();

        expect(result.response.data.source_domains).to.deep.equal([
            'COMPANY',
            'OFFICIAL',
            'SHARE',
            'EVENT',
            'COMMON',
        ]);
        expect(result.response.data.data_fields).to.deep.include({
            id: 'ENTITY_FIELD::entity.name',
            domain: 'COMPANY',
            label: 'Company Name',
            resolver_name: 'ENTITY_FIELD',
            resolver_path: 'entity.name',
            value_type: 'STRING',
            is_collection: false,
            selection_behavior: 'NONE',
            allowed_formats: [],
        });
    });

    it('normalizes and de-duplicates aliases', () => {
        expect(ShortcodeLibraryService.uniqueAliases([
            '{{Company_name}}',
            ' company_NAME ',
            'legacy.company_name',
        ], 'company.name')).to.deep.equal([
            'company_name',
            'legacy.company_name',
        ]);
    });

    it('does not store the canonical key as its own alias', () => {
        expect(ShortcodeLibraryService.uniqueAliases([
            '{{company.name}}',
            'Company_Name',
        ], 'company.name')).to.deep.equal(['company_name']);
    });

    it('stores the configured per-domain order', () => {
        const payload = new ShortcodeLibraryService()._payload({
            shortcode_key: 'company.test_value',
            label: 'Test Value',
            source_domain: 'COMPANY',
            sort_order: '4',
            resolver_name: 'ENTITY_FIELD',
            resolver_path: 'entity.name',
            value_type: 'STRING',
        }, 7);

        expect(payload.sort_order).to.equal(4);
        expect(payload.value_type).to.equal('STRING');
    });

    it('binds a manual shortcode to its backend handler key', () => {
        const payload = new ShortcodeLibraryService()._payload({
            shortcode_key: 'company.special_value',
            label: 'Special Value',
            source_domain: 'COMPANY',
            sort_order: 5,
            is_custom_backend: true,
            value_type: 'STRING',
        }, 7);

        expect(payload.resolver_name).to.equal('CUSTOM_BACKEND');
        expect(payload.resolver_path).to.equal('company.special_value');
    });

    it('sorts the library by domain, configured order, then key', async () => {
        let requestedOrder;
        const service = new ShortcodeLibraryService();
        service._models = () => ({
            form_shortcode_alias: {},
            form_shortcode_definition: {
                findAll: async options => {
                    requestedOrder = options.order;
                    return [];
                },
            },
        });

        await service.list();

        expect(requestedOrder).to.deep.equal([
            ['source_domain', 'ASC'],
            ['sort_order', 'ASC'],
            ['shortcode_key', 'ASC'],
        ]);
    });
});
