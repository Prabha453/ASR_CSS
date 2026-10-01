'use strict';

const table = require('../../helper/dbTable');
const catalog = require('../../config/formBuilder/commonShortcodeCatalog');
const { buildSemanticFingerprint, normalizeAliasKey } = require('../../domain/formBuilder/shortcodeDefinition');

module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();
        await queryInterface.bulkInsert(
            table('form_shortcode_definitions'),
            catalog.map(item => ({
                shortcode_key: item.key,
                label: item.label,
                source_domain: item.domain,
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
            })),
            {}
        );

        const definitions = await queryInterface.sequelize.query(
            `SELECT shortcode_id, shortcode_key FROM ${table('form_shortcode_definitions')} WHERE shortcode_key IN (:keys)`,
            {
                replacements: { keys: catalog.map(item => item.key) },
                type: Sequelize.QueryTypes.SELECT,
            }
        );
        const idsByKey = new Map(definitions.map(row => [row.shortcode_key, row.shortcode_id]));
        const aliases = catalog.flatMap(item => (item.aliases || []).map(alias => ({
            shortcode_id: idsByKey.get(item.key),
            alias_key: normalizeAliasKey(alias),
            is_deleted: false,
            created_by: null,
            created_at: now,
        })));
        if (aliases.length) {
            await queryInterface.bulkInsert(table('form_shortcode_aliases'), aliases, {});
        }
    },

    async down(queryInterface, Sequelize) {
        const aliasKeys = catalog.flatMap(item => (item.aliases || []).map(normalizeAliasKey));
        if (aliasKeys.length) {
            await queryInterface.bulkDelete(
                table('form_shortcode_aliases'),
                { alias_key: { [Sequelize.Op.in]: aliasKeys } }
            );
        }
        await queryInterface.bulkDelete(
            table('form_shortcode_definitions'),
            { shortcode_key: { [Sequelize.Op.in]: catalog.map(item => item.key) } }
        );
    },
};
