'use strict';

const table = require('../../helper/dbTable');
const catalog = require('../../config/formBuilder/commonShortcodeCatalog');
const { buildSemanticFingerprint } = require('../../domain/formBuilder/shortcodeDefinition');

const newKeys = Object.freeze([
    'official_record.occupation',
    'official_record.date_of_birth',
    'official_record.nationality',
    'official_record.identification_number',
    'official_record.identification_type',
    'official_record.default_address',
    'official_record.alternate_address',
    'official_record.contact_number',
    'official_record.telephone',
    'official_record.designation_or_occupation',
]);

const definitions = catalog.filter(item => item.domain === 'OFFICIAL');

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

const updateRow = (item, now) => {
    const row = definitionRow(item, now);
    return {
        label: row.label,
        source_domain: row.source_domain,
        sort_order: row.sort_order,
        resolver_name: row.resolver_name,
        resolver_path: row.resolver_path,
        value_type: row.value_type,
        is_collection: row.is_collection,
        sensitivity: row.sensitivity,
        description: row.description,
        example_value: row.example_value,
        allowed_formats: row.allowed_formats,
        selection_behavior: row.selection_behavior,
        role_tags: row.role_tags,
        semantic_fingerprint: row.semantic_fingerprint,
        status: row.status,
        is_deleted: row.is_deleted,
        updated_at: now,
    };
};

module.exports = {
    async up(queryInterface, Sequelize) {
        const definitionTable = table('form_shortcode_definitions');
        const existing = await queryInterface.sequelize.query(
            `SELECT shortcode_key FROM ${definitionTable} WHERE shortcode_key IN (:keys)`,
            {
                replacements: { keys: definitions.map(item => item.key) },
                type: Sequelize.QueryTypes.SELECT,
            }
        );
        const existingKeys = new Set(existing.map(row => row.shortcode_key));
        const now = new Date();
        const rows = definitions
            .filter(item => !existingKeys.has(item.key))
            .map(item => definitionRow(item, now));
        if (rows.length) await queryInterface.bulkInsert(definitionTable, rows, {});

        for (const item of definitions) {
            await queryInterface.bulkUpdate(
                definitionTable,
                updateRow(item, now),
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
            `SELECT shortcode_id FROM ${definitionTable} WHERE source_domain = 'OFFICIAL' `
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
