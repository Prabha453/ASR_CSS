'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        await queryInterface.createTable(
            table('tokens'),
            {

                id: {
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                    type: Sequelize.INTEGER,
                },

                token: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },

                user_id: {
                    allowNull: false,
                    type: Sequelize.INTEGER,
                },

                type: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },

                blacklisted: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },

                expires: {
                    allowNull: false,
                    type: Sequelize.DATE,
                },

                created_at: {
                    allowNull: false,
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },

                updated_at: {
                    allowNull: false,
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.literal(
                        'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
                    ),
                },

            }
        );

    },

    down: async (queryInterface, Sequelize) => {

        await queryInterface.dropTable(
            table('tokens')
        );

    },

};