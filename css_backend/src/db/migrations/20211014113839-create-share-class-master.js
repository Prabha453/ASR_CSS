'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('share_class_master'),
            {

                sc_id: {
                    type: Sequelize.SMALLINT.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                sc_name: {
                    type: Sequelize.STRING(150),
                    allowNull: false,
                },

                sc_slug: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                    unique: true,
                },

                sc_type: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                    defaultValue: '',
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
            table('share_class_master'),
            ['sc_slug'],
            {
                unique: true,
                name: 'uq_sc_slug',
            }
        );

        await queryInterface.addIndex(
            table('share_class_master'),
            ['is_deleted'],
            {
                name: 'idx_sc_deleted',
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.dropTable(
            table('share_class_master')
        );

    },

};