'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('address_history'),
            {
                addr_history_id: {
                    type: Sequelize.INTEGER.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                type: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: '0 - Company, 1 - Individual',
                },

                ref_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },

                category: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                },

                proposed_or_effective: {
                    type: Sequelize.TINYINT(1),
                    allowNull: false,
                    defaultValue: 0,
                    comment: '0 - Proposed, 1 - Effective',
                },

                proposed_date: {
                    type: Sequelize.STRING(20),
                    allowNull: false,
                },

                effective_date: {
                    type: Sequelize.STRING(20),
                    allowNull: true,
                },

                old_details: {
                    type: Sequelize.TEXT,
                    allowNull: false,
                },

                new_details: {
                    type: Sequelize.TEXT,
                    allowNull: false,
                },

                changed_by: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },

                changed_created_date: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue:
                        Sequelize.literal(
                            'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
                        ),
                },

                cron_status: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: '0 - Not Updated, 1 - Updated',
                },

            }
        );

        
        await queryInterface.addIndex(
            table('address_history'),
            ['type'],
            {
                name: 'idx_address_history_type',
            }
        );

        await queryInterface.addIndex(
            table('address_history'),
            ['ref_id'],
            {
                name: 'idx_address_history_ref_id',
            }
        );

        await queryInterface.addIndex(
            table('address_history'),
            ['cron_status'],
            {
                name: 'idx_address_history_cron_status',
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.dropTable(
            table('address_history')
        );

    },

};