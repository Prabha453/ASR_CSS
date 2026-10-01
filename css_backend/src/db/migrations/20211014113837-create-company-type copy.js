'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('company_type'),
            {

                company_type_id: {
                    type: Sequelize.SMALLINT.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                company_type_name: {
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
            table('company_type'),
            ['is_deleted'],
            {
                name: 'idx_company_type_deleted',
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.dropTable(
            table('company_type')
        );

    },

};