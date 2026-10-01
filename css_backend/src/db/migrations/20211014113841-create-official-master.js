'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('official_master'),
            {

                official_master_id: {
                    type: Sequelize.SMALLINT.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                official_master_name: {
                    type: Sequelize.STRING(150),
                    allowNull: false,
                },

                official_master_slug: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                    unique: true,
                },
                official_order: {
                    type: Sequelize.SMALLINT.UNSIGNED,
                    allowNull: false,
                    defaultValue: 0,
                    comment: 'Order for display purposes',
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
            table('official_master'),
            ['official_master_slug'],
            {
                unique: true,
                name: 'uq_official_slug',
            }
        );

        await queryInterface.addIndex(
            table('official_master'),
            ['is_deleted'],
            {
                name: 'idx_official_master_deleted',
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.dropTable(
            table('official_master')
        );

    },

};