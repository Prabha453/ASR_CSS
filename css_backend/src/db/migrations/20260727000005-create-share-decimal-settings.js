'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('share_decimal_settings'), {

            id: {
                type:          Sequelize.INTEGER.UNSIGNED,
                primaryKey:    true,
                autoIncrement: true,
                allowNull:     false,
            },

            entity_id: {
                type:      Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
            },

            no_of_share_decimal: {
                type:         Sequelize.TINYINT.UNSIGNED,
                allowNull:    false,
                defaultValue: 0,
            },

            issued_capital_decimal: {
                type:         Sequelize.TINYINT.UNSIGNED,
                allowNull:    false,
                defaultValue: 2,
            },

            paidup_capital_decimal: {
                type:         Sequelize.TINYINT.UNSIGNED,
                allowNull:    false,
                defaultValue: 2,
            },

            rounding_method: {
                type:         Sequelize.ENUM('ROUND', 'FLOOR', 'CEIL', 'MANUAL_ADJUST'),
                allowNull:    false,
                defaultValue: 'ROUND',
            },

            is_deleted: {
                type:         Sequelize.TINYINT(1),
                allowNull:    false,
                defaultValue: 0,
            },

            created_by: {
                type:         Sequelize.INTEGER.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
            },

            created_at: {
                type:         Sequelize.DATE,
                allowNull:    false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },

            updated_by: {
                type:         Sequelize.INTEGER.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
            },

            updated_at: {
                type:         Sequelize.DATE,
                allowNull:    false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
            },

        });

        // STORED GENERATED column — Sequelize createTable doesn't support this natively
        const t = table('share_decimal_settings');
        await queryInterface.sequelize.query(`
            ALTER TABLE \`${t}\`
            ADD COLUMN \`active_unique_key\` TINYINT
              GENERATED ALWAYS AS (CASE WHEN \`is_deleted\` = 0 THEN 1 ELSE NULL END) STORED
              AFTER \`is_deleted\`
        `);

        await queryInterface.addIndex(table('share_decimal_settings'), ['entity_id', 'is_deleted'],       { name: 'idx_share_decimal_entity' });

        // Unique constraint using the generated column (one active row per entity)
        await queryInterface.addConstraint(table('share_decimal_settings'), {
            fields: ['entity_id', 'active_unique_key'],
            type:   'unique',
            name:   'uq_share_decimal_entity',
        });

    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('share_decimal_settings'));
    },

};
