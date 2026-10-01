'use strict';

// These rules are application-owned safety defaults. They are intentionally
// not stored in company_event_rule, so users cannot edit, retire, or delete
// them from Event Rule settings. A matching published database rule always
// takes precedence over these defaults.

const SINGAPORE_COUNTRY_ID = 192;
const ORDINARY_AGM_AR_EXCLUDED_COMPANY_TYPE_IDS = new Set([
    6,  // Foreign Company registered in Singapore
    10, // Limited Liability Partnership (LLP)
    13, // Offshore Company
]);
const TAX_EVENT_SLUGS = new Set(['eci', 'tax-return']);

const DEFAULT_RULES = {
    eci: {
        system_default_key: 'SG_DEFAULT_ECI',
        event_slug: 'eci',
        rule_priority: -1000,
        rule_config: {
            groups: [{
                condition_mode: 'ALL',
                conditions: [],
                take: 'LATEST',
                steps: [{
                    reference_logic: 'FIELD',
                    field: 'FYE',
                    offset: { value: 3, unit: 'MONTH' },
                    source_basis: 'SYSTEM_DEFAULT_FYE_PLUS_3_MONTHS',
                }],
            }],
        },
    },
    'tax-return': {
        system_default_key: 'SG_DEFAULT_TAX_RETURN',
        event_slug: 'tax-return',
        rule_priority: -1000,
        rule_config: {
            groups: [{
                condition_mode: 'ALL',
                conditions: [],
                take: 'LATEST',
                steps: [{
                    reference_logic: 'FIELD',
                    field: 'NEXT_YA_NOV_30',
                    offset: { value: 0, unit: 'DAY' },
                    source_basis: 'SYSTEM_DEFAULT_NEXT_YA_NOVEMBER_30',
                }],
            }],
        },
    },
    'annual-filing': {
        system_default_key: 'SG_DEFAULT_FOREIGN_COMPANY_ANNUAL_FILING',
        event_slug: 'annual-filing',
        rule_priority: -1000,
        rule_config: {
            groups: [{
                condition_mode: 'ALL',
                conditions: [],
                take: 'LATEST',
                steps: [{
                    reference_logic: 'FIELD',
                    field: 'FYE',
                    offset: { value: 7, unit: 'MONTH' },
                    source_basis: 'SYSTEM_DEFAULT_FYE_PLUS_7_MONTHS',
                }],
            }],
        },
    },
    'annual-declaration': {
        system_default_key: 'SG_DEFAULT_LLP_ANNUAL_DECLARATION',
        event_slug: 'annual-declaration',
        rule_priority: -1000,
        rule_config: {
            groups: [{
                condition_mode: 'ALL',
                conditions: [],
                take: 'LATEST',
                steps: [{
                    reference_logic: 'FIELD',
                    field: 'INCORPORATION_DATE',
                    offset: { value: 15, unit: 'MONTH' },
                    source_basis: 'SYSTEM_DEFAULT_INCORPORATION_PLUS_15_MONTHS',
                }],
            }],
        },
    },
    anniversary: {
        system_default_key: 'SG_DEFAULT_OFFSHORE_ANNIVERSARY',
        event_slug: 'anniversary',
        rule_priority: -1000,
        rule_config: {
            groups: [{
                condition_mode: 'ALL',
                conditions: [],
                take: 'LATEST',
                steps: [{
                    reference_logic: 'FIELD',
                    field: 'INCORPORATION_DATE',
                    offset: { value: 1, unit: 'YEAR' },
                    source_basis: 'SYSTEM_DEFAULT_INCORPORATION_PLUS_1_YEAR',
                }],
            }],
        },
    },
    agm: {
        system_default_key: 'SG_DEFAULT_AGM',
        event_slug: 'agm',
        rule_priority: -1000,
        rule_config: {
            groups: [{
                condition_mode: 'ALL',
                conditions: [],
                take: 'LATEST',
                steps: [{
                    reference_logic: 'FIELD',
                    field: 'FYE',
                    offset: { value: 6, unit: 'MONTH' },
                    end_month: true,
                    source_basis: 'SYSTEM_DEFAULT_FYE_PLUS_6_MONTHS_END_OF_MONTH',
                }],
            }],
        },
    },
    ar: {
        system_default_key: 'SG_DEFAULT_AR',
        event_slug: 'ar',
        rule_priority: -1000,
        rule_config: {
            groups: [{
                condition_mode: 'ALL',
                conditions: [],
                take: 'LATEST',
                steps: [{
                    reference_logic: 'EVENT',
                    event_slug: 'agm',
                    offset: { value: 30, unit: 'DAY' },
                    source_basis: 'SYSTEM_DEFAULT_AGM_PLUS_30_DAYS',
                }],
            }],
        },
    },
};

const isSingaporeCompany = context =>
    Number(context.countryId) === SINGAPORE_COUNTRY_ID
    || String(context.country || '').trim().toLowerCase() === 'singapore';

const hasBusinessEntity = (context, expectedName) =>
    (context.businessEntityNames || []).some(name =>
        String(name || '').trim().toLowerCase() === expectedName
    );

const SYSTEM_DEFAULT_DISPLAY_SCOPE = {
    agm: {
        company_type_display_name: 'Ordinary companies (excluding Foreign Company, LLP and Offshore)',
        client_service_display: 'Corporate Shareholder Client',
    },
    ar: {
        company_type_display_name: 'Ordinary companies (excluding Foreign Company, LLP and Offshore)',
        client_service_display: 'Corporate Shareholder Client',
    },
    eci: {
        company_type_display_name: 'Ordinary companies (excluding Foreign Company, LLP and Offshore)',
        client_service_display: 'Taxation Client',
    },
    'tax-return': {
        company_type_display_name: 'Ordinary companies (excluding Foreign Company, LLP and Offshore)',
        client_service_display: 'Taxation Client',
    },
    anniversary: {
        company_type_ids: [13],
        company_type_display_name: 'Offshore Company',
        client_service_display: 'Corporate Shareholder Client',
    },
    'annual-declaration': {
        company_type_ids: [10],
        company_type_display_name: 'Limited Liability Partnership (LLP)',
        client_service_display: 'Corporate Shareholder Client',
    },
    'annual-filing': {
        company_type_ids: [6],
        company_type_display_name: 'Foreign Company registered in Singapore',
        client_service_display: 'Corporate Shareholder Client',
    },
};

const getDefaultCompanyEventRulesForDisplay = () =>
    Object.values(DEFAULT_RULES).map(rule => ({
        ...rule,
        rule_id: `system:${rule.system_default_key}`,
        country_ids: [SINGAPORE_COUNTRY_ID],
        legacy_country_ids: [SINGAPORE_COUNTRY_ID],
        company_type_ids: SYSTEM_DEFAULT_DISPLAY_SCOPE[rule.event_slug]?.company_type_ids || [],
        jurisdiction_id: null,
        is_active: true,
        is_system_default: true,
        version_status: 'SYSTEM_DEFAULT',
        company_type_display_name: SYSTEM_DEFAULT_DISPLAY_SCOPE[rule.event_slug]?.company_type_display_name,
        client_service_display: SYSTEM_DEFAULT_DISPLAY_SCOPE[rule.event_slug]?.client_service_display,
    }));

const getDefaultCompanyEventRule = (eventSlug, context = {}) => {
    if (!isSingaporeCompany(context)) return null;

    const isTaxEvent = TAX_EVENT_SLUGS.has(eventSlug);
    if (isTaxEvent && !hasBusinessEntity(context, 'taxation client')) return null;
    if (!isTaxEvent && !hasBusinessEntity(context, 'corporate shareholder client')) return null;

    const companyTypeId = Number(context.companyTypeId);
    if (eventSlug === 'anniversary') {
        return companyTypeId === 13
            ? { ...DEFAULT_RULES.anniversary, is_system_default: true }
            : null;
    }
    if (eventSlug === 'annual-declaration') {
        return companyTypeId === 10
            ? { ...DEFAULT_RULES['annual-declaration'], is_system_default: true }
            : null;
    }
    if (eventSlug === 'annual-filing') {
        return companyTypeId === 6
            ? { ...DEFAULT_RULES['annual-filing'], is_system_default: true }
            : null;
    }
    if (ORDINARY_AGM_AR_EXCLUDED_COMPANY_TYPE_IDS.has(companyTypeId)) return null;

    const rule = DEFAULT_RULES[eventSlug];
    return rule ? { ...rule, is_system_default: true } : null;
};

module.exports = {
    getDefaultCompanyEventRule,
    getDefaultCompanyEventRulesForDisplay,
};
