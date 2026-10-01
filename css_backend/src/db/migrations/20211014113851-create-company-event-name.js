'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('company_event_name'),
            {

                e_id: {
                    type: Sequelize.SMALLINT.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                event_type: {
                    type: Sequelize.STRING(20),
                    allowNull: false,
                    defaultValue: 'EVENT',
                    comment: 'EVENT = Event, LOG = Log',
                },

                event_name: {
                    type: Sequelize.STRING(150),
                    allowNull: false,
                },

                event_slug: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                },

                event_subject: {
                    type: Sequelize.STRING(300),
                    allowNull: true,
                },

                color_code: {
                    type: Sequelize.STRING(10),
                    allowNull: false,
                    defaultValue: '#3788D8',
                },

                is_system_event: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                    comment: '1 = Yes, 0 = No',
                },

                is_recurring: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                    comment: '1 = Yes, 0 = No',
                },

                recurring_period: {
                    type: Sequelize.INTEGER.UNSIGNED,
                    allowNull: false,
                    defaultValue: 0,
                },

                recurring_duration: {
                    type: Sequelize.STRING(50),
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
            table('company_event_name'),
            ['event_type'],
            {
                name: 'idx_event_name_type',
            }
        );

        await queryInterface.addIndex(
            table('company_event_name'),
            ['event_slug'],
            {
                name: 'idx_event_name_slug',
            }
        );

        await queryInterface.addIndex(
            table('company_event_name'),
            ['is_deleted'],
            {
                name: 'idx_event_name_deleted',
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.dropTable(
            table('company_event_name')
        );

    },

};
