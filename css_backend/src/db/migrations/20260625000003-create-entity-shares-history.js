'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        await queryInterface.createTable(table('entity_shares_history'), {

            id: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },

            entity_shares_id: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false,
            },

            entity_id: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false,
            },

            transaction_type: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },

            currency: {
                type: Sequelize.STRING(10),
                allowNull: false,
            },

            share_class_id: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false,
            },

            share_type: {
                type: Sequelize.ENUM('NORMAL', 'BONUS', 'GUARANTEE'),
                allowNull: false,
            },

            number_of_shares: {
                type: Sequelize.DOUBLE,
                allowNull: false,
                defaultValue: 0,
            },

            authorized_share_capital: {
                type: Sequelize.DOUBLE,
                allowNull: false,
                defaultValue: 0,
            },

            issued_share_capital: {
                type: Sequelize.DOUBLE,
                allowNull: false,
                defaultValue: 0,
            },

            paid_up_capital: {
                type: Sequelize.DOUBLE,
                allowNull: false,
                defaultValue: 0,
            },

            per_share: {
                type: Sequelize.DOUBLE,
                allowNull: false,
                defaultValue: 0,
            },

            issued_per_share: {
                type: Sequelize.DOUBLE,
                allowNull: false,
                defaultValue: 0,
            },

            guarantee_amount: {
                type: Sequelize.DOUBLE,
                allowNull: true,
                defaultValue: null,
            },

            delta_shares: {
                type: Sequelize.DOUBLE,
                allowNull: true,
                defaultValue: null,
            },

            delta_authorized_capital: {
                type: Sequelize.DOUBLE,
                allowNull: true,
                defaultValue: null,
            },

            delta_issued_capital: {
                type: Sequelize.DOUBLE,
                allowNull: true,
                defaultValue: null,
            },

            delta_paid_capital: {
                type: Sequelize.DOUBLE,
                allowNull: true,
                defaultValue: null,
            },

            delta_guarantee_amount: {
                type: Sequelize.DOUBLE,
                allowNull: true,
                defaultValue: null,
            },

            date_of_transaction: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },

            source_from: {
                type: Sequelize.ENUM('MANUAL', 'DM', 'BIZINSITE', 'WORKFLOW', 'API'),
                allowNull: false,
                defaultValue: 'MANUAL',
            },

            workflow_id: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: true,
                defaultValue: null,
            },

            workflow_status: {
                type: Sequelize.STRING(50),
                allowNull: true,
                defaultValue: null,
            },

            is_workflow: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },

            is_acra: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },

            is_vot: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },

            share_set_id: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },

            remarks: {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: null,
            },

            created_by: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: true,
                defaultValue: null,
            },

            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },

        });

        await queryInterface.addIndex(table('entity_shares_history'), ['entity_shares_id'],  { name: 'idx_esh_entity_shares_id' });
        await queryInterface.addIndex(table('entity_shares_history'), ['entity_id'],         { name: 'idx_esh_entity_id' });
        await queryInterface.addIndex(table('entity_shares_history'), ['share_set_id'],      { name: 'idx_esh_share_set_id' });
        await queryInterface.addIndex(table('entity_shares_history'), ['transaction_type'],  { name: 'idx_esh_transaction_type' });

    },

    down: async (queryInterface, Sequelize) => {

        await queryInterface.dropTable(table('entity_shares_history'));

    },

};
