const { expect } = require('chai');

const {
    getDefaultCompanyEventRule,
    getDefaultCompanyEventRulesForDisplay,
} = require('../../src/config/defaultCompanyEventRules');
const { calculateRuleDate } = require('../../src/helper/eventHelper');

describe('Default company event rules', () => {
    const context = {
        countryId: 192,
        country: 'Singapore',
        companyTypeId: 15,
        incorporationDate: '2026-01-15',
        fyeDate: '2027-01-14',
        businessEntityNames: ['corporate shareholder client'],
        previousEventsBySlug: {},
        eventSlugByEventId: {},
    };

    it('calculates the locked Singapore AGM and AR fallback dates', () => {
        const agmRule = getDefaultCompanyEventRule('agm', context);
        const agm = calculateRuleDate(agmRule, context, {});
        const arRule = getDefaultCompanyEventRule('ar', context);
        const ar = calculateRuleDate(arRule, context, { agm });

        expect(agmRule.is_system_default).to.equal(true);
        expect(agm.due_date).to.equal('2027-07-31');
        expect(ar.due_date).to.equal('2027-08-30');
    });

    it('does not apply ordinary defaults to deferred special company types', () => {
        expect(getDefaultCompanyEventRule('agm', { ...context, companyTypeId: 6 })).to.equal(null);
        expect(getDefaultCompanyEventRule('agm', { ...context, companyTypeId: 10 })).to.equal(null);
        expect(getDefaultCompanyEventRule('agm', { ...context, companyTypeId: 13 })).to.equal(null);
    });

    it('calculates the locked Offshore Company anniversary from incorporation', () => {
        const offshoreContext = { ...context, companyTypeId: 13 };
        const anniversaryRule = getDefaultCompanyEventRule('anniversary', offshoreContext);
        const anniversary = calculateRuleDate(anniversaryRule, offshoreContext, {});

        expect(anniversaryRule.is_system_default).to.equal(true);
        expect(anniversary.due_date).to.equal('2027-01-15');
        expect(getDefaultCompanyEventRule('agm', offshoreContext)).to.equal(null);
        expect(getDefaultCompanyEventRule('ar', offshoreContext)).to.equal(null);
    });

    it('does not create the Offshore anniversary for an ordinary company', () => {
        expect(getDefaultCompanyEventRule('anniversary', context)).to.equal(null);
    });

    it('calculates the locked LLP Annual Declaration at 15 months', () => {
        const llpContext = { ...context, companyTypeId: 10 };
        const declarationRule = getDefaultCompanyEventRule('annual-declaration', llpContext);
        const declaration = calculateRuleDate(declarationRule, llpContext, {});

        expect(declarationRule.is_system_default).to.equal(true);
        expect(declaration.due_date).to.equal('2027-04-15');
        expect(getDefaultCompanyEventRule('agm', llpContext)).to.equal(null);
        expect(getDefaultCompanyEventRule('ar', llpContext)).to.equal(null);
    });

    it('does not create Annual Declaration for a non-LLP company', () => {
        expect(getDefaultCompanyEventRule('annual-declaration', context)).to.equal(null);
    });

    it('calculates Foreign Company Annual Filing at seven months after FYE', () => {
        const foreignCompanyContext = { ...context, companyTypeId: 6 };
        const filingRule = getDefaultCompanyEventRule('annual-filing', foreignCompanyContext);
        const filing = calculateRuleDate(filingRule, foreignCompanyContext, {});

        expect(filingRule.is_system_default).to.equal(true);
        expect(filing.due_date).to.equal('2027-08-14');
        expect(getDefaultCompanyEventRule('agm', foreignCompanyContext)).to.equal(null);
        expect(getDefaultCompanyEventRule('ar', foreignCompanyContext)).to.equal(null);
    });

    it('does not create Annual Filing for an ordinary local company', () => {
        expect(getDefaultCompanyEventRule('annual-filing', context)).to.equal(null);
    });

    it('does not apply Singapore defaults to another country', () => {
        expect(getDefaultCompanyEventRule('agm', {
            ...context,
            countryId: 1,
            country: 'India',
        })).to.equal(null);
    });

    it('calculates ECI and Tax Return only for a Taxation Client', () => {
        const taxContext = {
            ...context,
            businessEntityNames: ['corporate shareholder client', 'taxation client'],
        };
        const eciRule = getDefaultCompanyEventRule('eci', taxContext);
        const taxReturnRule = getDefaultCompanyEventRule('tax-return', taxContext);

        expect(eciRule.is_system_default).to.equal(true);
        expect(calculateRuleDate(eciRule, taxContext, {}).due_date).to.equal('2027-04-14');
        expect(taxReturnRule.is_system_default).to.equal(true);
        expect(calculateRuleDate(taxReturnRule, taxContext, {}).due_date).to.equal('2028-11-30');
    });

    it('does not create tax events without the Taxation Client selection', () => {
        expect(getDefaultCompanyEventRule('eci', context)).to.equal(null);
        expect(getDefaultCompanyEventRule('tax-return', context)).to.equal(null);
    });

    it('does not create corporate-secretarial events for a taxation-only client', () => {
        const taxationOnlyContext = {
            ...context,
            businessEntityNames: ['taxation client'],
        };

        expect(getDefaultCompanyEventRule('agm', taxationOnlyContext)).to.equal(null);
        expect(getDefaultCompanyEventRule('ar', taxationOnlyContext)).to.equal(null);
        expect(getDefaultCompanyEventRule('eci', taxationOnlyContext)).to.not.equal(null);
        expect(getDefaultCompanyEventRule('tax-return', taxationOnlyContext)).to.not.equal(null);
    });

    it('exposes all locked defaults as read-only display metadata', () => {
        const rules = getDefaultCompanyEventRulesForDisplay();

        expect(rules).to.have.length(7);
        expect(rules.every(rule => rule.is_system_default)).to.equal(true);
        expect(rules.every(rule => rule.version_status === 'SYSTEM_DEFAULT')).to.equal(true);
        expect(rules.find(rule => rule.event_slug === 'eci').client_service_display).to.equal('Taxation Client');
        expect(rules.find(rule => rule.event_slug === 'annual-declaration').company_type_ids).to.deep.equal([10]);
    });
});
