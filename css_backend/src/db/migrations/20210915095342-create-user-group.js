'use strict';

const table = require('../../helper/dbTable');

module.exports = {
    up: async (queryInterface, Sequelize) => {

        await queryInterface.createTable(table('user_group'), {

            user_group_id: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },

            group_name: {
                type: Sequelize.STRING(150),
                allowNull: false,
            },

            group_description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },

            permissions_json: {
                type: Sequelize.TEXT,
                allowNull: true,
                
            },

            is_deleted: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },

            created_date: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },

            created_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },

            updated_date: {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: Sequelize.literal(
                    'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
                ),
            },

            updated_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },

        });

        // INDEX
        await queryInterface.addIndex(
            table('user_group'),
            ['is_deleted'],
            {
                name: 'idx_user_group_deleted',
            }
        );

    },

    down: async (queryInterface, Sequelize) => {

        await queryInterface.dropTable(table('user_group'));

    },
};