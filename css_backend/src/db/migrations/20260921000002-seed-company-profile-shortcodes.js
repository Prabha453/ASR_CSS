'use strict';

const table = require('../../helper/dbTable');
const catalog = require('../../config/formBuilder/commonShortcodeCatalog');
const { buildSemanticFingerprint } = require('../../domain/formBuilder/shortcodeDefinition');

const newKeys = Object.freeze([
    'company.local_address',
    'company.foreign_address',
    'company.strike_off_or_dissolved_date',
    'company.bank_name',
    'company.ssic_code_1',
    'company.ssic_description_1',
    'company.ssic_code_2',
    'company.ssic_description_2',
    'company.new_name',
    'company.old_name',
    'company.old_name_effective_date',
    'company.new_registered_address',
    'company.old_registered_address',
    'company.old_registered_address_effective_date',
]);

const companyDefinitions = catalog.filter(item => item.domain === 'COMPANY');

const definitionRow = (item, now) => ({
    shortcode_key: item.key,
    label: item.label,
    source_domain: item.domain,
    sort_order: item.order,
    resolver_name: item.resolver,
    resolver_path: item.path,
    value_type: item.type,
    is_collection: Boolean(item.collection),
    sensitivity: item.sensitivity || 'INTERNAL',
    description: item.description || null,
    example_value: item.example || null,
    allowed_formats: JSON.stringify(item.formats || []),
    selection_behavior: item.selection || 'NONE',
    role_tags: JSON.stringify(item.roleTags || []),
    semantic_fingerprint: buildSemanticFingerprint({
        label: item.label,
        sourceDomain: item.domain,
        resolverName: item.resolver,
        resolverPath: item.path,
        valueType: item.type,
        isCollection: Boolean(item.collection),
    }),
    status: 'ACTIVE',
    is_deleted: false,
    created_by: null,
    created_at: now,
    updated_by: null,
    updated_at: now,
});

module.exports = {
    async up(queryInterface, Sequelize) {
        const definitionTable = table('form_shortcode_definitions');
        const existing = await queryInterface.sequelize.query(
            `SELECT shortcode_key FROM ${definitionTable} WHERE shortcode_key IN (:keys)`,
            {
                replacements: { keys: companyDefinitions.map(item => item.key) },
                type: Sequelize.QueryTypes.SELECT,
            }
        );
        const existingKeys = new Set(existing.map(row => row.shortcode_key));
        const now = new Date();
        const newRows = companyDefinitions
            .filter(item => !existingKeys.has(item.key))
            .map(item => definitionRow(item, now));
        if (newRows.length) {
            await queryInterface.bulkInsert(definitionTable, newRows, {});
        }

        // Keep the requested document-field sequence together within COMPANY,
        // and repair existing common definitions to their application-owned
        // resolver metadata without disturbing aliases or tenant-only rows.
        for (const item of companyDefinitions) {
            const canonical = definitionRow(item, now);
            const update = item.order <= 19 ? {
                label: canonical.label,
                source_domain: canonical.source_domain,
                sort_order: canonical.sort_order,
                resolver_name: canonical.resolver_name,
                resolver_path: canonical.resolver_path,
                value_type: canonical.value_type,
                is_collection: canonical.is_collection,
                sensitivity: canonical.sensitivity,
                description: canonical.description,
                example_value: canonical.example_value,
                allowed_formats: canonical.allowed_formats,
                selection_behavior: canonical.selection_behavior,
                role_tags: canonical.role_tags,
                semantic_fingerprint: canonical.semantic_fingerprint,
                status: canonical.status,
                is_deleted: canonical.is_deleted,
                updated_at: now,
            } : { sort_order: item.order };
            await queryInterface.bulkUpdate(
                definitionTable,
                update,
                { shortcode_key: item.key }
            );
        }
    },

    async down(queryInterface, Sequelize) {
        const definitionTable = table('form_shortcode_definitions');
        await queryInterface.bulkDelete(definitionTable, {
            shortcode_key: { [Sequelize.Op.in]: newKeys },
        });

        const remaining = await queryInterface.sequelize.query(
            `SELECT shortcode_id FROM ${definitionTable} WHERE source_domain = 'COMPANY' `
            + 'ORDER BY shortcode_key ASC',
            { type: Sequelize.QueryTypes.SELECT }
        );
        for (let index = 0; index < remaining.length; index += 1) {
            await queryInterface.bulkUpdate(
                definitionTable,
                { sort_order: index + 1 },
                { shortcode_id: remaining[index].shortcode_id }
            );
        }
    },
};
