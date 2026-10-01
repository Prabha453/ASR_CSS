'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('tag'),
            {

                tag_id: {
                    type: Sequelize.SMALLINT.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                tag_name: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                },

                tag_color: {
                    type: Sequelize.STRING(10),
                    allowNull: false,
                    defaultValue: '#000000',
                    comment: 'Hex color',
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
            table('tag'),
            ['is_deleted'],
            {
                name: 'idx_tag_deleted',
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.dropTable(
            table('tag')
        );

    },

};