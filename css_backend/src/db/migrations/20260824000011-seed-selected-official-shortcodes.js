'use strict';

const table = require('../../helper/dbTable');
const catalog = require('../../config/formBuilder/commonShortcodeCatalog');
const { buildSemanticFingerprint } = require('../../domain/formBuilder/shortcodeDefinition');

const definitions = catalog.filter(item => item.key.startsWith('official_record.'));

module.exports = {
    async up(queryInterface) {
        const [existing] = await queryInterface.sequelize.query(
            `SELECT shortcode_key FROM ${table('form_shortcode_definitions')} WHERE shortcode_key IN (:keys)`,
            { replacements: { keys: definitions.map(item => item.key) } }
        );
        const keys = new Set(existing.map(item => item.shortcode_key));
        const now = new Date();
        const rows = definitions.filter(item => !keys.has(item.key)).map(item => ({
            shortcode_key: item.key, label: item.label, source_domain: item.domain,
            resolver_name: item.resolver, resolver_path: item.path, value_type: item.type,
            is_collection: Boolean(item.collection), sensitivity: item.sensitivity || 'INTERNAL',
            description: item.description || null, example_value: item.example || null,
            allowed_formats: JSON.stringify(item.formats || []),
            selection_behavior: item.selection || 'NONE', role_tags: JSON.stringify(item.roleTags || []),
            semantic_fingerprint: buildSemanticFingerprint({
                label: item.label, sourceDomain: item.domain, resolverName: item.resolver,
                resolverPath: item.path, valueType: item.type, isCollection: Boolean(item.collection),
            }),
            status: 'ACTIVE', is_deleted: false, created_by: null, created_at: now,
            updated_by: null, updated_at: now,
        }));
        if (rows.length) await queryInterface.bulkInsert(table('form_shortcode_definitions'), rows, {});
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete(table('form_shortcode_definitions'), {
            shortcode_key: { [Sequelize.Op.in]: definitions.map(item => item.key) },
        });
    },
};
