'use strict';

const table = require('../../helper/dbTable');
const catalog = require('../../config/formBuilder/commonShortcodeCatalog');
const { buildSemanticFingerprint } = require('../../domain/formBuilder/shortcodeDefinition');

const newKeys = Object.freeze([
    'event.date_of_agm',
    'event.agm_held_date',
    'event.actual_fye',
    'event.year_of_fye',
    'event.first_fye_date',
    'event.last_fye_date',
    'event.last_date_of_month',
    'event.chairman_name',
]);

const definitions = catalog.filter(item => newKeys.includes(item.key));

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
    delete row.shortcode_key;
    delete row.created_by;
    delete row.created_at;
    return row;
};

module.exports = {
    async up(queryInterface, Sequelize) {
        const definitionTable = table('form_shortcode_definitions');
        const existing = await queryInterface.sequelize.query(
            `SELECT shortcode_key FROM ${definitionTable} WHERE shortcode_key IN (:keys)`,
            {
                replacements: { keys: newKeys },
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
        await queryInterface.bulkUpdate(
            table('form_shortcode_definitions'),
            { status: 'RETIRED', updated_at: new Date() },
            { shortcode_key: { [Sequelize.Op.in]: newKeys } }
        );
    },
};
