'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('product_and_service'),
            {

                product_service_id: {
                    type: Sequelize.BIGINT.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                item_name: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                },

                currency_code: {
                    type: Sequelize.STRING(10),
                    allowNull: false,
                    defaultValue: 'SGD',
                },

                range_low: {
                    type: Sequelize.STRING(50),
                    allowNull: true,
                },

                range_high: {
                    type: Sequelize.STRING(50),
                    allowNull: true,
                },

                fee_amount: {
                    type: Sequelize.DECIMAL(15, 2),
                    allowNull: false,
                    defaultValue: 0.00,
                },

                quantity: {
                    type: Sequelize.INTEGER.UNSIGNED,
                    allowNull: false,
                    defaultValue: 1,
                },

                uom: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                },

                status: {
                    type: Sequelize.ENUM(
                        'ACTIVE',
                        'INACTIVE'
                    ),
                    allowNull: false,
                    defaultValue: 'ACTIVE',
                },

                commission_type: {
                    type: Sequelize.ENUM(
                        'FIXED',
                        'PERCENTAGE'
                    ),
                    allowNull: true,
                },

                commission_value: {
                    type: Sequelize.DECIMAL(15, 2),
                    allowNull: true,
                },

                service_type: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                },

                category_id: {
                    type: Sequelize.SMALLINT.UNSIGNED,
                    allowNull: true,
                    references: {
                        model: table('entity_service_category'),
                        key: 'service_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL',
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
            table('product_and_service'),
            ['is_deleted'],
            {
                name: 'idx_product_service_deleted',
            }
        );

        await queryInterface.addIndex(
            table('product_and_service'),
            ['status'],
            {
                name: 'idx_product_service_status',
            }
        );

        await queryInterface.addIndex(
            table('product_and_service'),
            ['category_id'],
            {
                name: 'idx_product_service_category',
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.dropTable(
            table('product_and_service')
        );

    },

};