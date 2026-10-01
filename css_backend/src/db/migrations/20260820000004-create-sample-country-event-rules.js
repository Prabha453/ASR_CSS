'use strict';

const table = require('../../helper/dbTable');
const definitions = require('../../config/sampleCountryEventRules');

const EFFECTIVE_FROM = '2026-01-01';

module.exports = {
    async up(queryInterface, Sequelize) {
        const countriesTable = table('countries');
        const jurisdictionsTable = table('jurisdictions');
        const authoritiesTable = table('authorities');
        const eventsTable = table('company_event_name');
        const rulesTable = table('company_event_rule');
        const selectOne = async (sql, replacements) => {
            const rows = await queryInterface.sequelize.query(sql, {
                replacements,
                type: Sequelize.QueryTypes.SELECT,
            });
            return rows[0] || null;
        };

        let unitedStates = await selectOne(
            `SELECT id FROM \`${countriesTable}\` WHERE iso = 'US' OR iso3 = 'USA' LIMIT 1`,
            {}
        );
        if (!unitedStates) {
            await queryInterface.bulkInsert(countriesTable, [{
                iso: 'US', acra_iso: 'US', name: 'UNITED STATES', country_name: 'United States',
                nationality: 'American', iso3: 'USA', currency_string: 'US Dollar', currency_code: 'USD',
                numcode: 840, phonecode: 1, phone_length: '10', region_id: 6, addr_format: null, is_delete: 0,
            }]);
            unitedStates = await selectOne(`SELECT id FROM \`${countriesTable}\` WHERE iso = 'US' LIMIT 1`, {});
        }

        const countryByIso = { US: unitedStates.id };
        for (const iso of ['IN', 'AE', 'MY']) {
            const country = await selectOne(`SELECT id FROM \`${countriesTable}\` WHERE iso = :iso LIMIT 1`, { iso });
            if (!country) throw new Error(`Required country master ${iso} is missing`);
            countryByIso[iso] = country.id;
        }

        const nationalJurisdictionByIso = {};
        const countryNames = { US: 'United States', IN: 'India', AE: 'United Arab Emirates', MY: 'Malaysia' };
        for (const iso of Object.keys(countryByIso)) {
            const countryId = countryByIso[iso];
            let jurisdiction = await selectOne(
                `SELECT jurisdiction_id FROM \`${jurisdictionsTable}\` WHERE country_id = :countryId AND level = 'COUNTRY_NATIONAL' AND is_deleted = 0 LIMIT 1`,
                { countryId }
            );
            if (!jurisdiction) {
                await queryInterface.bulkInsert(jurisdictionsTable, [{
                    country_id: countryId, parent_jurisdiction_id: null, level: 'COUNTRY_NATIONAL',
                    name: countryNames[iso], code: iso, is_active: true, is_deleted: false,
                    created_date: new Date(), created_by: null, updated_date: new Date(), updated_by: null,
                }]);
                jurisdiction = await selectOne(
                    `SELECT jurisdiction_id FROM \`${jurisdictionsTable}\` WHERE country_id = :countryId AND level = 'COUNTRY_NATIONAL' AND is_deleted = 0 LIMIT 1`,
                    { countryId }
                );
            }
            nationalJurisdictionByIso[iso] = jurisdiction.jurisdiction_id;
        }

        let delaware = await selectOne(
            `SELECT jurisdiction_id FROM \`${jurisdictionsTable}\` WHERE country_id = :countryId AND code = 'US-DE' AND is_deleted = 0 LIMIT 1`,
            { countryId: countryByIso.US }
        );
        if (!delaware) {
            await queryInterface.bulkInsert(jurisdictionsTable, [{
                country_id: countryByIso.US,
                parent_jurisdiction_id: nationalJurisdictionByIso.US,
                level: 'STATE_PROVINCE', name: 'Delaware', code: 'US-DE',
                is_active: true, is_deleted: false, created_date: new Date(), created_by: null,
                updated_date: new Date(), updated_by: null,
            }]);
            delaware = await selectOne(
                `SELECT jurisdiction_id FROM \`${jurisdictionsTable}\` WHERE country_id = :countryId AND code = 'US-DE' AND is_deleted = 0 LIMIT 1`,
                { countryId: countryByIso.US }
            );
        }

        for (const definition of definitions) {
            const countryId = countryByIso[definition.countryIso];
            const jurisdictionId = definition.jurisdictionCode === 'US-DE'
                ? delaware.jurisdiction_id
                : nationalJurisdictionByIso[definition.countryIso];

            let authority = await selectOne(
                `SELECT authority_id FROM \`${authoritiesTable}\` WHERE name = :name AND country_id = :countryId AND is_deleted = 0 LIMIT 1`,
                { name: definition.authority.name, countryId }
            );
            if (!authority) {
                await queryInterface.bulkInsert(authoritiesTable, [{
                    ...definition.authority, country_id: countryId, jurisdiction_id: jurisdictionId,
                    is_active: true, is_deleted: false, created_date: new Date(), created_by: null,
                    updated_date: new Date(), updated_by: null,
                }]);
                authority = await selectOne(
                    `SELECT authority_id FROM \`${authoritiesTable}\` WHERE name = :name AND country_id = :countryId AND is_deleted = 0 LIMIT 1`,
                    { name: definition.authority.name, countryId }
                );
            }

            let event = await selectOne(
                `SELECT e_id FROM \`${eventsTable}\` WHERE event_slug = :eventSlug AND is_deleted = 0 LIMIT 1`,
                { eventSlug: definition.event.event_slug }
            );
            if (!event) {
                await queryInterface.bulkInsert(eventsTable, [{
                    event_type: 'EVENT', ...definition.event, color_code: '#299CDB',
                    authority_id: authority.authority_id, authority_type: definition.authority.authority_type,
                    is_system_event: false, is_recurring: false, recurring_period: 0, recurring_duration: '',
                    operational_lead_days: 30, grace_period_days: 0, default_frequency: 'ANNUAL',
                    supports_extension: true, supports_waiver: true, evidence_required: false,
                    active: true, is_deleted: false, created_date: new Date(), created_by: null,
                    updated_date: new Date(), updated_by: null,
                }]);
                event = await selectOne(
                    `SELECT e_id FROM \`${eventsTable}\` WHERE event_slug = :eventSlug AND is_deleted = 0 LIMIT 1`,
                    { eventSlug: definition.event.event_slug }
                );
            }

            const ruleJurisdictionId = definition.jurisdictionCode ? jurisdictionId : null;
            const existingRule = await selectOne(
                `SELECT rule_id FROM \`${rulesTable}\` WHERE event_slug = :eventSlug AND legacy_country_ids = :countryId AND ((jurisdiction_id IS NULL AND :jurisdictionId IS NULL) OR jurisdiction_id = :jurisdictionId) AND version_status = 'PUBLISHED' AND is_deleted = 0 LIMIT 1`,
                { eventSlug: definition.event.event_slug, countryId: String(countryId), jurisdictionId: ruleJurisdictionId }
            );
            if (existingRule) continue;

            await queryInterface.bulkInsert(rulesTable, [{
                event_id: event.e_id, event_slug: definition.event.event_slug,
                country_ids: String(countryId), legacy_country_ids: String(countryId),
                company_type_ids: definition.companyTypeIds, jurisdiction_id: ruleJurisdictionId,
                rule_config: JSON.stringify({
                    ...definition.ruleConfig,
                    country_ids: String(countryId), legacy_country_ids: String(countryId),
                    company_type_ids: definition.companyTypeIds,
                    scope: {
                        country_ids: String(countryId), customer_country_ids: String(countryId),
                        company_type_ids: definition.companyTypeIds,
                    },
                }),
                is_active: true, is_deleted: false, version_no: 1, version_status: 'PUBLISHED',
                effective_from: EFFECTIVE_FROM, effective_to: null, rule_priority: -500,
                created_date: new Date(), created_by: null, updated_date: new Date(), updated_by: null,
                published_date: new Date(), published_by: null,
            }]);
            const createdRule = await selectOne(
                `SELECT rule_id FROM \`${rulesTable}\` WHERE event_slug = :eventSlug AND legacy_country_ids = :countryId AND version_status = 'PUBLISHED' AND is_deleted = 0 ORDER BY rule_id DESC LIMIT 1`,
                { eventSlug: definition.event.event_slug, countryId: String(countryId) }
            );
            await queryInterface.bulkUpdate(rulesTable, { rule_code: createdRule.rule_id }, { rule_id: createdRule.rule_id });
        }
    },

    async down(queryInterface) {
        const slugs = definitions.map(definition => definition.event.event_slug);
        await queryInterface.bulkDelete(table('company_event_rule'), { event_slug: slugs });
        await queryInterface.bulkDelete(table('company_event_name'), { event_slug: slugs });
    },
};
