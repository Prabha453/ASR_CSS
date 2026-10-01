'use strict';

const { expect } = require('chai');

const {
    normalizeCanonicalKey,
    normalizeAliasKey,
    assertCanonicalKey,
    buildSemanticFingerprint,
} = require('../../src/domain/formBuilder/shortcodeDefinition');

describe('Form shortcode definitions', () => {
    it('normalizes wrapped canonical keys', () => {
        expect(normalizeCanonicalKey(' {{ Company.Registration_Number }} '))
            .to.equal('company.registration_number');
    });

    it('normalizes legacy aliases case-insensitively', () => {
        expect(normalizeAliasKey('{{Company_name}}')).to.equal('company_name');
    });

    it('accepts lowercase dotted canonical keys', () => {
        expect(assertCanonicalKey('selected.secretary.name'))
            .to.equal('selected.secretary.name');
    });

    it('rejects undotted or presentation-specific keys', () => {
        expect(() => assertCanonicalKey('Company_name')).to.throw('lowercase dotted key');
        expect(() => assertCanonicalKey('company.name.bold')).not.to.throw();
        expect(() => assertCanonicalKey('company-name')).to.throw('lowercase dotted key');
    });

    it('produces the same semantic fingerprint for equivalent labels', () => {
        const base = {
            sourceDomain: 'COMPANY',
            resolverName: 'COMPANY_FIELD',
            resolverPath: 'company.registration_number',
            valueType: 'STRING',
        };

        expect(buildSemanticFingerprint({ ...base, label: 'Company Registration Number' }))
            .to.equal(buildSemanticFingerprint({ ...base, label: 'Registration Number, Company' }));
    });

    it('distinguishes scalar and collection meanings', () => {
        const base = {
            label: 'Director Name',
            sourceDomain: 'OFFICIAL',
            resolverName: 'CURRENT_DIRECTORS',
            resolverPath: 'directors.name',
            valueType: 'STRING',
        };

        expect(buildSemanticFingerprint(base))
            .not.to.equal(buildSemanticFingerprint({ ...base, isCollection: true }));
    });
});
