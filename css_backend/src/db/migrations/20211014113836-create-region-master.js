'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('region_master'),
            {

                region_id: {
                    type: Sequelize.SMALLINT.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                region_name: {
                    type: Sequelize.STRING(150),
                    allowNull: false,
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

        /*
        |--------------------------------------------------------------------------
        | Indexes
        |--------------------------------------------------------------------------
        */

        await queryInterface.addIndex(
            table('region_master'),
            ['is_deleted'],
            {
                name: 'idx_region_deleted',
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.dropTable(
            table('region_master')
        );

    },

};