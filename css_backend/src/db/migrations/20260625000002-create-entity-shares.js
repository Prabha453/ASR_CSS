'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        await queryInterface.createTable(table('entity_shares'), {

            id: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },

            entity_id: {
                type: Sequelize.INTEGER.UNSIGNED,
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
                defaultValue: 'NORMAL',
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

            is_deleted: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },

            share_set_id: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true,
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

            updated_by: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: true,
                defaultValue: null,
            },

            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
            },

        });

        await queryInterface.addIndex(table('entity_shares'), ['entity_id'],      { name: 'idx_entity_shares_entity_id' });
        await queryInterface.addIndex(table('entity_shares'), ['share_class_id'], { name: 'idx_entity_shares_share_class_id' });
        await queryInterface.addIndex(table('entity_shares'), ['share_set_id'],   { name: 'idx_entity_shares_share_set_id' });
        await queryInterface.addIndex(table('entity_shares'), ['is_deleted'],     { name: 'idx_entity_shares_is_deleted' });

    },

    down: async (queryInterface, Sequelize) => {

        await queryInterface.dropTable(table('entity_shares'));

    },

};
