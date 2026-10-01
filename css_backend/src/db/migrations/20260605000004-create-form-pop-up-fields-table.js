'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('form_pop_up_fields'),
            {

                form_pop_up_field_id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                form_pop_up_field_name: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                },

                form_pop_up_field_slug: {
                    type: Sequelize.TEXT,
                    allowNull: false,
                },

                is_deleted: {
                    type: Sequelize.TINYINT,
                    allowNull: true,
                    defaultValue: 0,
                    comment: '0- Active, 1- Deleted',
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
            table('form_pop_up_fields'),
            ['is_deleted'],
            {
                name: 'idx_form_pop_up_fields_deleted',
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.dropTable(
            table('form_pop_up_fields')
        );

    },

};
