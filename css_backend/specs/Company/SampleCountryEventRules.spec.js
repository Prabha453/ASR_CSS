'use strict';

const { expect } = require('chai');

const definitions = require('../../src/config/sampleCountryEventRules');
const { calculateRuleDate } = require('../../src/helper/eventHelper');

describe('Sample country event rules', () => {
    const definition = slug => definitions.find(item => item.event.event_slug === slug);
    const calculate = (slug, context, generated = {}) => calculateRuleDate(
        { rule_config: definition(slug).ruleConfig },
        context,
        generated
    );

    it('calculates the Delaware annual report on March 1 of the following incorporation year', () => {
        const result = calculate('us-de-annual-report', {
            incorporationDate: '2026-05-15',
            fyeDate: '2027-05-14',
            rulePhase: 'FIRST',
        });
        expect(result.due_date).to.equal('2027-03-01');
    });

    it('calculates India first AGM, AOC-4 and MGT-7 dates', () => {
        const context = {
            incorporationDate: '2025-04-01',
            fyeDate: '2026-03-31',
            rulePhase: 'FIRST',
            eventSlugByEventId: {},
            previousEventsBySlug: {},
        };
        const agm = calculate('india-agm', context);
        const aoc4 = calculate('india-aoc-4', context, { 'india-agm': agm });
        const mgt7 = calculate('india-mgt-7', context, { 'india-agm': agm });

        expect(agm.due_date).to.equal('2026-12-31');
        expect(aoc4.due_date).to.equal('2027-01-30');
        expect(mgt7.due_date).to.equal('2027-03-01');
    });

    it('calculates the UAE corporate tax return at nine months after FYE', () => {
        const result = calculate('uae-corporate-tax-return', {
            incorporationDate: '2026-01-01',
            fyeDate: '2026-12-31',
            rulePhase: 'FIRST',
        });
        expect(result.due_date).to.equal('2027-09-30');
    });

    it('calculates the Malaysia annual return at 30 days after incorporation anniversary', () => {
        const result = calculate('malaysia-annual-return', {
            incorporationDate: '2026-01-15',
            fyeDate: '2027-01-14',
            rulePhase: 'FIRST',
        });
        expect(result.due_date).to.equal('2027-02-14');
    });
});
