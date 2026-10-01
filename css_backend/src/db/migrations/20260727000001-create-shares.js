'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('shares'), {

            share_id: {
                type:          Sequelize.BIGINT.UNSIGNED,
                primaryKey:    true,
                autoIncrement: true,
                allowNull:     false,
            },

            entity_id: {
                type:      Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
            },

            transaction_type_id: {
                type:      Sequelize.SMALLINT.UNSIGNED,
                allowNull: false,
            },

            extra_type_of_transaction: {
                type:         Sequelize.STRING(100),
                allowNull:    true,
                defaultValue: null,
            },

            transaction_date: {
                type:      Sequelize.DATEONLY,
                allowNull: false,
            },

            status: {
                type:         Sequelize.ENUM('DRAFT', 'CONFIRMED', 'VALID', 'INVALID', 'CANCELLED'),
                allowNull:    false,
                defaultValue: 'DRAFT',
            },

            source_from: {
                type:         Sequelize.ENUM('MANUAL', 'DM', 'BIZINSITE', 'WORKFLOW', 'API', 'OPENING'),
                allowNull:    false,
                defaultValue: 'MANUAL',
            },

            workflow_id: {
                type:         Sequelize.INTEGER.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
            },

            workflow_status: {
                type:         Sequelize.STRING(50),
                allowNull:    true,
                defaultValue: null,
            },

            is_workflow: {
                type:         Sequelize.TINYINT(1),
                allowNull:    false,
                defaultValue: 0,
            },

            is_acra: {
                type:         Sequelize.TINYINT(1),
                allowNull:    false,
                defaultValue: 0,
            },

            is_discrepancy: {
                type:         Sequelize.TINYINT(1),
                allowNull:    false,
                defaultValue: 0,
            },

            remarks: {
                type:         Sequelize.TEXT,
                allowNull:    true,
                defaultValue: null,
            },

            is_deleted: {
                type:         Sequelize.TINYINT(1),
                allowNull:    false,
                defaultValue: 0,
            },

            share_set_id: {
                type:      Sequelize.STRING(100),
                allowNull: false,
                unique:    true,
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

        await queryInterface.addIndex(table('shares'), ['entity_id', 'transaction_date'],                          { name: 'idx_shares_entity_date' });
        await queryInterface.addIndex(table('shares'), ['entity_id', 'transaction_type_id', 'transaction_date'],   { name: 'idx_shares_entity_type_date' });
        await queryInterface.addIndex(table('shares'), ['entity_id', 'status', 'is_deleted'],                      { name: 'idx_shares_status' });
        await queryInterface.addIndex(table('shares'), ['workflow_id', 'workflow_status'],                          { name: 'idx_shares_workflow' });

    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('shares'));
    },

};
