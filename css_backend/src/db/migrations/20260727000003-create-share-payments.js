'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('share_payments'), {

            id: {
                type:          Sequelize.BIGINT.UNSIGNED,
                primaryKey:    true,
                autoIncrement: true,
                allowNull:     false,
            },

            entity_id: {
                type:      Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
            },

            share_transaction_id: {
                type:      Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
            },

            share_set_id: {
                type:      Sequelize.STRING(100),
                allowNull: false,
            },

            payment_type: {
                type:      Sequelize.ENUM('CASH', 'OTHERWISE_THAN_CASH', 'NO_CONSIDERATION'),
                allowNull: false,
            },

            cash: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    true,
                defaultValue: null,
            },

            otherwise_cash: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    true,
                defaultValue: null,
            },

            no_consideration: {
                type:         Sequelize.TINYINT(1),
                allowNull:    false,
                defaultValue: 0,
            },

            consideration_description: {
                type:         Sequelize.TEXT,
                allowNull:    true,
                defaultValue: null,
            },

            payment_date: {
                type:         Sequelize.DATEONLY,
                allowNull:    true,
                defaultValue: null,
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

        await queryInterface.addIndex(table('share_payments'), ['share_transaction_id'],                          { name: 'idx_share_payment_share' });
        await queryInterface.addIndex(table('share_payments'), ['entity_id', 'share_set_id'],                     { name: 'idx_share_payment_entity_set' });
        await queryInterface.addIndex(table('share_payments'), ['entity_id', 'payment_type', 'payment_date'],     { name: 'idx_share_payment_type' });

    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('share_payments'));
    },

};
