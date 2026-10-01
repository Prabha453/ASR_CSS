'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('company_ssic_code'),
            {

                ssic_id: {
                    type: Sequelize.INTEGER.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                ssic_code: {
                    type: Sequelize.STRING(20),
                    allowNull: false,
                },

                ssic_description: {
                    type: Sequelize.STRING(500),
                    allowNull: false,
                },

                country: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                    defaultValue: 'Singapore',
                },

                country_code: {
                    type: Sequelize.CHAR(3),
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
            table('company_ssic_code'),
            ['ssic_code', 'country_code'],
            {
                unique: true,
                name: 'uq_ssic_code_country',
            }
        );

        await queryInterface.addIndex(
            table('company_ssic_code'),
            ['ssic_code'],
            {
                name: 'idx_ssic_code',
            }
        );

        await queryInterface.addIndex(
            table('company_ssic_code'),
            ['ssic_description'],
            {
                type: 'FULLTEXT',
                name: 'ft_ssic_description',
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.dropTable(
            table('company_ssic_code')
        );

    },

};