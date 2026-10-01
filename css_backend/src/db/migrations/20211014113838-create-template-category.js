'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('template_category'),
            {

                tc_id: {
                    type: Sequelize.SMALLINT.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                tc_name: {
                    type: Sequelize.STRING(150),
                    allowNull: false,
                },

                tc_slug: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                    unique: true,
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
            table('template_category'),
            ['tc_slug'],
            {
                unique: true,
                name: 'uq_tc_slug',
            }
        );

        await queryInterface.addIndex(
            table('template_category'),
            ['is_deleted'],
            {
                name: 'idx_tc_deleted',
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.dropTable(
            table('template_category')
        );

    },

};