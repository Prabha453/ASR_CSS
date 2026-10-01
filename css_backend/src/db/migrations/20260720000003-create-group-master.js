'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('group_master'),
            {

                group_id: {
                    type: Sequelize.SMALLINT.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                group_name: {
                    type: Sequelize.STRING(100),
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

        await queryInterface.addIndex(
            table('group_master'),
            ['is_deleted'],
            {
                name: 'idx_group_master_deleted',
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.dropTable(
            table('group_master')
        );

    },

};
