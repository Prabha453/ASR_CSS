'use strict';

const table = require('../../helper/dbTable');

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(table('form_shortcode_definitions'), {
            shortcode_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            shortcode_key: {
                type: Sequelize.STRING(190),
                allowNull: false,
                unique: true,
            },
            label: {
                type: Sequelize.STRING(190),
                allowNull: false,
            },
            source_domain: {
                type: Sequelize.ENUM(
                    'COMPANY', 'OFFICIAL', 'SHARE', 'EVENT', 'COMMON',
                    'TRANSACTION', 'MANUAL', 'CALCULATED', 'DOCUMENT', 'SYSTEM'
                ),
                allowNull: false,
            },
            resolver_name: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            resolver_path: {
                type: Sequelize.STRING(190),
                allowNull: false,
            },
            value_type: {
                type: Sequelize.ENUM(
                    'STRING', 'TEXT', 'BOOLEAN', 'INTEGER', 'DECIMAL', 'MONEY',
                    'DATE', 'DATETIME', 'EMAIL', 'ADDRESS', 'FILE_REFERENCE', 'JSON'
                ),
                allowNull: false,
                defaultValue: 'STRING',
            },
            is_collection: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            sensitivity: {
                type: Sequelize.ENUM('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'),
                allowNull: false,
                defaultValue: 'INTERNAL',
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            example_value: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            allowed_formats: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            selection_behavior: {
                type: Sequelize.ENUM('NONE', 'ALL', 'SELECT_ONE', 'SELECT_MANY'),
                allowNull: false,
                defaultValue: 'NONE',
            },
            role_tags: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            semantic_fingerprint: {
                type: Sequelize.STRING(64),
                allowNull: false,
            },
            status: {
                type: Sequelize.ENUM('ACTIVE', 'DEPRECATED', 'RETIRED'),
                allowNull: false,
                defaultValue: 'ACTIVE',
            },
            is_deleted: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
            updated_at: { type: Sequelize.DATE, allowNull: true },
        });

        await queryInterface.createTable(table('form_shortcode_aliases'), {
            alias_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            shortcode_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                references: {
                    model: table('form_shortcode_definitions'),
                    key: 'shortcode_id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            alias_key: {
                type: Sequelize.STRING(190),
                allowNull: false,
                unique: true,
            },
            is_deleted: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false },
        });

        await queryInterface.addIndex(
            table('form_shortcode_definitions'),
            ['source_domain', 'status'],
            { name: 'idx_form_shortcode_domain_status' }
        );
        await queryInterface.addIndex(
            table('form_shortcode_definitions'),
            ['semantic_fingerprint'],
            { name: 'idx_form_shortcode_semantic_fingerprint' }
        );
        await queryInterface.addIndex(
            table('form_shortcode_aliases'),
            ['shortcode_id'],
            { name: 'idx_form_shortcode_alias_definition' }
        );
    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('form_shortcode_aliases'));
        await queryInterface.dropTable(table('form_shortcode_definitions'));
    },
};
