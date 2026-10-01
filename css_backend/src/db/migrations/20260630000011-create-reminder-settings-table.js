'use strict';

const table = require('../../helper/dbTable');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable(table('reminder'), {
            reminder_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            category: {
                type: Sequelize.ENUM('EVENT', 'LOG'),
                allowNull: false,
                defaultValue: 'EVENT',
            },
            event_id: {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: true,
            },
            company_type_id: {
                // was: company_type
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
                allowNull: false,
                defaultValue: 'ACTIVE',
            },
            timing_type: {
                // was: before_after (0/1)
                type: Sequelize.ENUM('BEFORE', 'AFTER'),
                allowNull: false,
                defaultValue: 'BEFORE',
            },
            offset_days: {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: false,
                defaultValue: 0,
            },
            is_recurring: {
                // was: recurring_reminder (0/1)
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            recurring_interval_type: {
                // was: recurring_interval_type ('daily' / 'custom')
                type: Sequelize.ENUM('DAILY', 'CUSTOM'),
                allowNull: true,
            },
            recurring_interval_days: {
                // was: recurring_reminder_days
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: true,
                defaultValue: 1,
            },
            sender_name: {
                // was: email_name
                type: Sequelize.STRING(150),
                allowNull: false,
            },
            subject: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            message: {
                type: Sequelize.TEXT('long'),
                allowNull: false,
            },
            is_deleted: {
                // was: physical DELETE — now soft-deleted, consistent with company_event
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            created_date: { type: Sequelize.DATE, allowNull: true },
            created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
            updated_date: { type: Sequelize.DATE, allowNull: true },
            updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        });

        await queryInterface.addIndex(table('reminder'), ['category'], { name: 'idx_reminder_category' });
        await queryInterface.addIndex(table('reminder'), ['event_id'], { name: 'idx_reminder_event_id' });
        await queryInterface.addIndex(table('reminder'), ['company_type_id'], { name: 'idx_reminder_company_type_id' });
        await queryInterface.addIndex(table('reminder'), ['status'], { name: 'idx_reminder_status' });
        await queryInterface.addIndex(table('reminder'), ['is_deleted'], { name: 'idx_reminder_deleted' });
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable(table('reminder'));
    },
};
