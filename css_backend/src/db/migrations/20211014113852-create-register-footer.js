'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('register_footer'),
            {

                rf_id: {
                    type: Sequelize.SMALLINT.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                re_type: {
                    type: Sequelize.STRING(50),
                    allowNull: false,
                },

                re_text: {
                    type: Sequelize.TEXT,
                    allowNull: false,
                },

            }
        );

        await queryInterface.addIndex(
            table('register_footer'),
            ['re_type'],
            {
                name: 'idx_register_footer_type',
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.dropTable(
            table('register_footer')
        );

    },

};