'use strict';

const table = require('../../helper/dbTable');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable(table('company_event_reminder_log'), {
            log_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            company_event_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
            },
            reminder_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
            },
            scheduled_date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            sent_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('PENDING', 'SENT', 'FAILED', 'SKIPPED'),
                allowNull: false,
                defaultValue: 'PENDING',
            },
            delivery_summary: {
                type: Sequelize.JSON,
                allowNull: true,
                comment: 'User-facing delivery summary, counts, recipient buckets, and display messages',
            },
            delivery_details: {
                type: Sequelize.JSON,
                allowNull: true,
                comment: 'Full technical audit details from SMTP/provider, attachments, and recipient-level results',
            },
            subject_snapshot: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            message_snapshot: {
                type: Sequelize.TEXT('long'),
                allowNull: true,
            },
            sender_email: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            email_config_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },
            reply_to_email: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            error_message: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            created_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            created_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },
            updated_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            updated_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },
        });

        await queryInterface.addIndex(table('company_event_reminder_log'), ['company_event_id'], { name: 'idx_cerl_company_event_id' });
        await queryInterface.addIndex(table('company_event_reminder_log'), ['reminder_id'], { name: 'idx_cerl_reminder_id' });
        await queryInterface.addIndex(table('company_event_reminder_log'), ['scheduled_date'], { name: 'idx_cerl_scheduled_date' });
        await queryInterface.addIndex(table('company_event_reminder_log'), ['status'], { name: 'idx_cerl_status' });
        await queryInterface.addIndex(
            table('company_event_reminder_log'),
            ['company_event_id', 'reminder_id', 'scheduled_date'],
            { name: 'uniq_cerl_event_reminder_date', unique: true }
        );
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable(table('company_event_reminder_log'));
    },
};
