'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('css_status'),
            {

                css_status_id: {
                    type: Sequelize.SMALLINT.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                css_status_name: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                },

                css_status_color: {
                    type: Sequelize.STRING(10),
                    allowNull: true,
                    defaultValue: '#6C757D',
                    comment: 'Badge color hex',
                },

                is_deleted: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },

                updated_date: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },

                updated_by: {
                    type: Sequelize.BIGINT.UNSIGNED,
                    allowNull: true,
                },

            }
        );

        await queryInterface.addIndex(
            table('css_status'),
            ['is_deleted'],
            {
                name: 'idx_css_status_deleted',
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.dropTable(
            table('css_status')
        );

    },

};