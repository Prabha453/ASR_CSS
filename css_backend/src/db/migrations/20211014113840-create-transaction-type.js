'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('transaction_type'),
            {

                t_id: {
                    type: Sequelize.SMALLINT.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                t_type: {
                    type: Sequelize.STRING(50),
                    allowNull: false,
                    comment:
                        'Category/group of transaction',
                },

                t_name: {
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

        await queryInterface.addIndex(
            table('transaction_type'),
            ['t_type'],
            {
                name: 'idx_transaction_type',
            }
        );

        await queryInterface.addIndex(
            table('transaction_type'),
            ['is_deleted'],
            {
                name: 'idx_transaction_deleted',
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.dropTable(
            table('transaction_type')
        );

    },

};