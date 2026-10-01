'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('type_of_fee'),
            {

                fee_id: {
                    type: Sequelize.INTEGER.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                type_of_fee: {
                    type: Sequelize.STRING(150),
                    allowNull: false,
                },

                currency: {
                    type: Sequelize.CHAR(3),
                    allowNull: false,
                    defaultValue: 'SGD',
                },

                low_range: {
                    type: Sequelize.DECIMAL(15, 2),
                    allowNull: true,
                },

                high_range: {
                    type: Sequelize.DECIMAL(15, 2),
                    allowNull: true,
                },

                fee_amt: {
                    type: Sequelize.DECIMAL(15, 2),
                    allowNull: false,
                    defaultValue: 0.00,
                },

                plus_minus: {
                    type: Sequelize.TINYINT,
                    allowNull: false,
                    defaultValue: 0,
                    comment: '1=add, -1=subtract',
                },

                category_id: {
                    type: Sequelize.SMALLINT.UNSIGNED,
                    allowNull: true,
                },

                description: {
                    type: Sequelize.STRING(500),
                    allowNull: true,
                },

                detailed_description: {
                    type: Sequelize.TEXT,
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
            table('type_of_fee'),
            ['currency'],
            {
                name: 'idx_fee_currency',
            }
        );

        await queryInterface.addIndex(
            table('type_of_fee'),
            ['category_id'],
            {
                name: 'idx_fee_category',
            }
        );

        await queryInterface.addIndex(
            table('type_of_fee'),
            ['is_deleted'],
            {
                name: 'idx_fee_deleted',
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.dropTable(
            table('type_of_fee')
        );

    },

};