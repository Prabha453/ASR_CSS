'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        await queryInterface.createTable(table('entity_share_decimal_settings'), {

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

            no_of_share_decimal_place: {
                type: Sequelize.TINYINT.UNSIGNED,
                allowNull: true,
                defaultValue: null,
            },

            paid_up_share_decimal_place: {
                type: Sequelize.TINYINT.UNSIGNED,
                allowNull: true,
                defaultValue: null,
            },

            issued_share_decimal_place: {
                type: Sequelize.TINYINT.UNSIGNED,
                allowNull: true,
                defaultValue: null,
            },

        });

        await queryInterface.addIndex(
            table('entity_share_decimal_settings'),
            ['entity_id'],
            { name: 'idx_esds_entity_id', unique: true }
        );

    },

    down: async (queryInterface) => {
        await queryInterface.dropTable(table('entity_share_decimal_settings'));
    },

};
