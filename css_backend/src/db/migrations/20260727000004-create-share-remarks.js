'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('share_remarks'), {

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
                type:         Sequelize.BIGINT.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
            },

            share_set_id: {
                type:         Sequelize.STRING(100),
                allowNull:    true,
                defaultValue: null,
            },

            transaction_status: {
                type:         Sequelize.ENUM('IN', 'OUT', 'NONE'),
                allowNull:    true,
                defaultValue: null,
            },

            remarks: {
                type:      Sequelize.TEXT,
                allowNull: false,
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

        await queryInterface.addIndex(table('share_remarks'), ['share_transaction_id'],                          { name: 'idx_share_remarks_share' });
        await queryInterface.addIndex(table('share_remarks'), ['entity_id', 'share_set_id'],                     { name: 'idx_share_remarks_entity_set' });
        await queryInterface.addIndex(table('share_remarks'), ['entity_id', 'transaction_status', 'is_deleted'], { name: 'idx_share_remarks_status' });

    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('share_remarks'));
    },

};
