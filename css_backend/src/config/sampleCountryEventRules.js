'use strict';

const COMPANY_TYPE_IDS = '12,15,16,18,19,20';
const group = steps => ({ condition_mode: 'ALL', conditions: [], take: 'LATEST', steps });

module.exports = [
    {
        countryIso: 'US', jurisdictionCode: 'US-DE',
        authority: { name: 'Delaware Division of Corporations', authority_type: 'State Corporate Registrar' },
        event: { event_name: 'Delaware Annual Report', event_slug: 'us-de-annual-report', event_subject: 'Delaware Annual Report and Franchise Tax', category: 'CORPORATE_SECRETARIAL' },
        companyTypeIds: COMPANY_TYPE_IDS,
        ruleConfig: { groups: [group([{ reference_logic: 'FIELD', field: 'NEXT_MARCH_1_AFTER_INCORPORATION_YEAR', offset: { value: 0, unit: 'DAY' }, source_basis: 'US_DE_NEXT_MARCH_1_AFTER_INCORPORATION_YEAR' }])] },
    },
    {
        countryIso: 'IN',
        authority: { name: 'Ministry of Corporate Affairs / Registrar of Companies', authority_type: 'National Corporate Registrar' },
        event: { event_name: 'India AGM', event_slug: 'india-agm', event_subject: 'India Annual General Meeting Due Date', category: 'CORPORATE_SECRETARIAL' },
        companyTypeIds: COMPANY_TYPE_IDS,
        ruleConfig: { groups: [group([{ reference_logic: 'FIELD', field: 'FYE', offset: { value: 9, unit: 'MONTH' }, end_month: true, source_basis: 'INDIA_FIRST_AGM_FYE_PLUS_9_MONTHS' }])] },
    },
    {
        countryIso: 'IN',
        authority: { name: 'Ministry of Corporate Affairs / Registrar of Companies', authority_type: 'National Corporate Registrar' },
        event: { event_name: 'India AOC-4', event_slug: 'india-aoc-4', event_subject: 'India Financial Statements Filing', category: 'CORPORATE_SECRETARIAL' },
        companyTypeIds: COMPANY_TYPE_IDS,
        ruleConfig: { groups: [group([{ reference_logic: 'EVENT', event_slug: 'india-agm', offset: { value: 30, unit: 'DAY' }, source_basis: 'INDIA_AGM_PLUS_30_DAYS' }])] },
    },
    {
        countryIso: 'IN',
        authority: { name: 'Ministry of Corporate Affairs / Registrar of Companies', authority_type: 'National Corporate Registrar' },
        event: { event_name: 'India MGT-7', event_slug: 'india-mgt-7', event_subject: 'India Annual Return Filing', category: 'CORPORATE_SECRETARIAL' },
        companyTypeIds: COMPANY_TYPE_IDS,
        ruleConfig: { groups: [group([{ reference_logic: 'EVENT', event_slug: 'india-agm', offset: { value: 60, unit: 'DAY' }, source_basis: 'INDIA_AGM_PLUS_60_DAYS' }])] },
    },
    {
        countryIso: 'AE',
        authority: { name: 'Federal Tax Authority', authority_type: 'National Tax Authority' },
        event: { event_name: 'UAE Corporate Tax Return', event_slug: 'uae-corporate-tax-return', event_subject: 'UAE Corporate Tax Return Due Date', category: 'TAX' },
        companyTypeIds: COMPANY_TYPE_IDS,
        ruleConfig: { groups: [group([{ reference_logic: 'FIELD', field: 'FYE', offset: { value: 9, unit: 'MONTH' }, source_basis: 'UAE_FYE_PLUS_9_MONTHS' }])] },
    },
    {
        countryIso: 'MY',
        authority: { name: 'Companies Commission of Malaysia (SSM)', authority_type: 'National Corporate Registrar' },
        event: { event_name: 'Malaysia Annual Return', event_slug: 'malaysia-annual-return', event_subject: 'Malaysia Annual Return Due Date', category: 'CORPORATE_SECRETARIAL' },
        companyTypeIds: COMPANY_TYPE_IDS,
        ruleConfig: { groups: [group([{ reference_logic: 'FIELD', field: 'INCORPORATION_ANNIVERSARY', offset: { value: 30, unit: 'DAY' }, source_basis: 'MALAYSIA_ANNIVERSARY_PLUS_30_DAYS' }])] },
    },
];
