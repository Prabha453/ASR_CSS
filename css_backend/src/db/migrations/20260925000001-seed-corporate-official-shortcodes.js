'use strict';

const table = require('../../helper/dbTable');
const catalog = require('../../config/formBuilder/commonShortcodeCatalog');
const { buildSemanticFingerprint } = require('../../domain/formBuilder/shortcodeDefinition');

const newKeys = Object.freeze([
    'official_record.company_type',
    'official_record.country',
    'official_record.incorporation_date',
    'official_record.registered_company_address',
    'official_record.registration_number',
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

        // Refresh all application-owned OFFICIAL ordering so scalar fields stay
        // ahead of collection blocks in both existing and newly created tenants.
        for (const item of catalog.filter(entry => entry.domain === 'OFFICIAL')) {
            const update = newKeys.includes(item.key)
                ? updateRow(item, now)
                : { sort_order: item.order, updated_at: now };
            await queryInterface.bulkUpdate(definitionTable, update, { shortcode_key: item.key });
        }
    },

    async down(queryInterface, Sequelize) {
        const definitionTable = table('form_shortcode_definitions');
        await queryInterface.bulkDelete(definitionTable, {
            shortcode_key: { [Sequelize.Op.in]: newKeys },
        });

        const previousCollectionOrder = {
            'officials.all': 20,
            'officials.all_list': 21,
            'officials.directors': 22,
            'officials.secretaries': 23,
            'officials.shareholders': 24,
        };
        for (const [shortcodeKey, sortOrder] of Object.entries(previousCollectionOrder)) {
            await queryInterface.bulkUpdate(
                definitionTable,
                { sort_order: sortOrder, updated_at: new Date() },
                { shortcode_key: shortcodeKey }
            );
        }
    },
};
