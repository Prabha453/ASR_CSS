'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('share_distinctive'), {

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

            share_cert_no: {
                type:         Sequelize.STRING(100),
                allowNull:    true,
                defaultValue: null,
            },

            distinctive_from: {
                type:         Sequelize.STRING(100),
                allowNull:    true,
                defaultValue: null,
            },

            distinctive_to: {
                type:         Sequelize.STRING(100),
                allowNull:    true,
                defaultValue: null,
            },

            no_of_shares: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
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

        await queryInterface.addIndex(table('share_distinctive'), ['share_transaction_id'],                          { name: 'idx_distinctive_share' });
        await queryInterface.addIndex(table('share_distinctive'), ['entity_id', 'share_set_id'],                     { name: 'idx_distinctive_entity_set' });
        await queryInterface.addIndex(table('share_distinctive'), ['entity_id', 'share_cert_no'],                    { name: 'idx_distinctive_cert' });
        await queryInterface.addIndex(table('share_distinctive'), ['entity_id', 'distinctive_from', 'distinctive_to'], { name: 'idx_distinctive_range' });

    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('share_distinctive'));
    },

};
