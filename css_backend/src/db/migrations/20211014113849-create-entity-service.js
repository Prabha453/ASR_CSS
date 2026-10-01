'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('entity_service'),
            {

                service_id: {
                    type: Sequelize.SMALLINT.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                service_name: {
                    type: Sequelize.STRING(200),
                    allowNull: false,
                },

                service_description: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },

                service_image: {
                    type: Sequelize.STRING(500),
                    allowNull: true,
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
            table('entity_service'),
            ['is_deleted'],
            {
                name: 'idx_service_deleted',
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.dropTable(
            table('entity_service')
        );

    },

};