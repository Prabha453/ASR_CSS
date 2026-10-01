'use strict';

const table = require('../../helper/dbTable');

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(table('form_template_versions'), {
            template_version_id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            form_id: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false,
                references: { model: table('forms'), key: 'form_id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            version_number: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
            lifecycle_status: { type: Sequelize.ENUM('DRAFT', 'PUBLISHED', 'RETIRED'), allowNull: false, defaultValue: 'DRAFT' },
            source_type: { type: Sequelize.ENUM('HTML', 'DOCX'), allowNull: false, defaultValue: 'HTML' },
            content_snapshot: { type: Sequelize.TEXT('long'), allowNull: true },
            source_doc_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
            popup_schema: { type: Sequelize.JSON, allowNull: true },
            layout_snapshot: { type: Sequelize.JSON, allowNull: false },
            content_hash: { type: Sequelize.STRING(64), allowNull: false },
            published_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
            published_at: { type: Sequelize.DATE, allowNull: true },
            created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false },
        });

        await queryInterface.createTable(table('form_template_version_fields'), {
            version_field_id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            template_version_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                references: { model: table('form_template_versions'), key: 'template_version_id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            shortcode_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
                references: { model: table('form_shortcode_definitions'), key: 'shortcode_id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            original_key: { type: Sequelize.STRING(190), allowNull: false },
            canonical_key: { type: Sequelize.STRING(190), allowNull: true },
            formatters: { type: Sequelize.JSON, allowNull: false },
            occurrences: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
            is_block: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            is_required: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            validation_status: { type: Sequelize.ENUM('VALID', 'UNKNOWN', 'INVALID_FORMAT'), allowNull: false },
            validation_message: { type: Sequelize.STRING(500), allowNull: true },
        });

        await queryInterface.addIndex(table('form_template_versions'), ['form_id', 'version_number'], {
            name: 'uq_form_template_version_number', unique: true,
        });
        await queryInterface.addIndex(table('form_template_versions'), ['form_id', 'lifecycle_status'], {
            name: 'idx_form_template_version_lifecycle',
        });
        await queryInterface.addIndex(table('form_template_version_fields'), ['template_version_id'], {
            name: 'idx_form_template_version_fields_version',
        });
        await queryInterface.addIndex(table('form_template_version_fields'), ['canonical_key'], {
            name: 'idx_form_template_version_fields_key',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('form_template_version_fields'));
        await queryInterface.dropTable(table('form_template_versions'));
    },
};
