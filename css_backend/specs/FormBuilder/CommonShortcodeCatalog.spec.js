'use strict';

const { expect } = require('chai');
const catalog = require('../../src/config/formBuilder/commonShortcodeCatalog');
const { isAllowedResolverPath } = require('../../src/config/formBuilder/shortcodeResolverRegistry');
const { assertCanonicalKey, normalizeAliasKey } = require('../../src/domain/formBuilder/shortcodeDefinition');
const ShortcodeResolverService = require('../../src/service/formBuilder/ShortcodeResolverService');

describe('Common shortcode deployment catalogue', () => {
    const allowedValueTypes = new Set([
        'STRING', 'TEXT', 'BOOLEAN', 'INTEGER', 'DECIMAL', 'MONEY',
        'DATE', 'DATETIME', 'EMAIL', 'ADDRESS', 'FILE_REFERENCE', 'JSON',
    ]);

    it('contains unique valid canonical keys', () => {
        const keys = catalog.map(item => assertCanonicalKey(item.key));
        expect(new Set(keys).size).to.equal(keys.length);
    });

    it('uses only value types supported by the registry schema', () => {
        expect(catalog.filter(item => !allowedValueTypes.has(item.type))).to.deep.equal([]);
    });

    it('uses only allow-listed resolver/path pairs', () => {
        for (const item of catalog) {
            expect(
                isAllowedResolverPath(item.resolver, item.path),
                `${item.key} uses unregistered ${item.resolver}:${item.path}`
            ).to.equal(true);
        }
    });

    it('resolves every deployed shortcode when its source data is populated', async () => {
        const setPath = (target, path, value) => {
            const parts = path.split('.');
            const leaf = parts.pop();
            const parent = parts.reduce((current, part) => {
                if (!current[part]) current[part] = {};
                return current[part];
            }, target);
            parent[leaf] = value;
        };
        const resolver = new ShortcodeResolverService({});

        for (const item of catalog) {
            const context = {};
            const sample = item.collection ? [{ name: 'Sample' }] : 'Sample';
            setPath(context, item.path, sample);
            if (item.resolver === 'PRIMARY_IDENTIFICATION') {
                context.identification = { uen_no: '202600001A' };
            }
            if (item.resolver === 'ENTITY_CONTACT') context.primary_email = 'forms@example.com';
            if (item.resolver === 'CURRENT_SHARES') context.shares = [{ share_id: 1 }];

            const result = await resolver._resolveDefinition({
                shortcode_key: item.key,
                source_domain: item.domain,
                resolver_name: item.resolver,
                resolver_path: item.path,
                value_type: item.type,
                is_collection: Boolean(item.collection),
            }, context, new Date('2026-09-23T00:00:00Z'));

            expect(result.resolved, `${item.key} did not resolve: ${result.reason}`).to.equal(true);
        }
    });

    it('does not collide aliases with canonical keys or other aliases', () => {
        const canonical = new Set(catalog.map(item => item.key));
        const aliases = catalog.flatMap(item => (item.aliases || []).map(normalizeAliasKey));
        expect(aliases.some(alias => canonical.has(alias))).to.equal(false);
        expect(new Set(aliases).size).to.equal(aliases.length);
    });

    it('contains no tenant form or company values', () => {
        for (const item of catalog) {
            expect(item).not.to.have.any.keys('form_id', 'entity_id', 'tenant_id', 'company_value');
        }
    });

    it('exposes only the replacement share shortcodes in the requested order', () => {
        const shareDefinitions = catalog.filter(item => item.domain === 'SHARE');
        expect(shareDefinitions.map(item => item.label)).to.deep.equal([
            'Shareholder name',
            'Shareholder Address',
            'Shareholder ID type',
            'Shareholder NRIC No.',
            'Currency',
            'Shareholder Nationality',
            'Shareholder Phone',
            'Shareholder Mobile',
            'Share Cert No',
            'No of Share',
            'Price per share',
            'No of Share in word(Spelt out)',
            'Cash Paid Up Capital',
            'Cash Paid Up Capital - Word',
            'Consideration Paid Up Capital',
            'Consideration Paid Up Capital - Word',
            'Cash + Consideration Paid Up Capital',
            'Transferor Name',
            'Transferor ID type',
            'Transferor ID No.',
            'Transferor Address',
            'Transferee Name',
            'Transferee ID Type',
            'Transferee ID No.',
            'Transferee Address',
            'Transfer amount of share',
        ]);
        expect(shareDefinitions.map(item => item.order)).to.deep.equal(
            Array.from({ length: 26 }, (unused, index) => index + 1)
        );
        expect(shareDefinitions.every(item => item.resolver === 'SHARE_DETAIL')).to.equal(true);
    });

    it('contains the requested missing event shortcodes', () => {
        const labels = catalog
            .filter(item => item.domain === 'EVENT')
            .map(item => item.label);
        expect(labels).to.include.members([
            'Date Of AGM',
            'AGM Held Date',
            'Actual Fye',
            'Year Of Fye',
            'First FYE Date',
            'last FYE Date',
            'Last date of the month',
            'Chairman Name',
        ]);
    });

    it('contains the corporate official shortcodes in display order', () => {
        const keys = new Set([
            'official_record.company_type',
            'official_record.country',
            'official_record.incorporation_date',
            'official_record.registered_company_address',
            'official_record.registration_number',
        ]);
        const definitions = catalog
            .filter(item => keys.has(item.key))
            .sort((left, right) => left.order - right.order);

        expect(definitions.map(item => item.label)).to.deep.equal([
            'Company Type',
            'Country',
            'Incorporation date',
            'Registered company address',
            'Registration Number(UEN/FBRM/DB/ACRA)',
        ]);
        expect(definitions.every(item => (
            item.domain === 'OFFICIAL' && item.resolver === 'SELECTED_OFFICIAL'
        ))).to.equal(true);
    });

    it('contains the common banking shortcodes in display order', () => {
        const commonDefinitions = catalog
            .filter(item => item.domain === 'COMMON')
            .sort((left, right) => left.order - right.order);
        expect(commonDefinitions.map(item => item.label)).to.deep.equal([
            'Bank Name',
            'Account Number',
            'Account Type',
            'Current Date',
        ]);
    });
});
