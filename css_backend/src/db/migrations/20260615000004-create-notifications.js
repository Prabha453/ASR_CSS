'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        await queryInterface.createTable(table('notifications'), {

            // ─── Primary Key ───────────────────────────────────────────
            id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },

            // ─── Recipients & Context ──────────────────────────────────
            recipient_user_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'User who receives and sees this notification',
                references: {
                    model: table('users'),
                    key: 'user_id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },

            company_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Company this notification relates to (NULL for system-level alerts)',
                references: {
                    model: table('company_profile'),
                    key: 'cp_id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },

            // ─── Notification Type ─────────────────────────────────────
            type: {
                type: Sequelize.ENUM(
                    'AGM_REMINDER',
                    'AR_REMINDER',
                    'CEI_REMINDER',
                    'CHANGE_REQUEST_EXPIRY',
                    'SYSTEM_ALERT',
                    'PASSWORD_EXPIRY',
                    'LOGIN_ALERT'
                ),
                allowNull: false,
                comment: 'Category of notification for filtering and icon display',
            },

            // ─── Content ───────────────────────────────────────────────
            title: {
                type: Sequelize.STRING(200),
                allowNull: false,
                comment: 'Short heading shown in the notification bell / email subject',
            },

            message: {
                type: Sequelize.TEXT,
                allowNull: false,
                comment: 'Full notification body / email content',
            },

            // ─── Delivery Channel ──────────────────────────────────────
            channel: {
                type: Sequelize.ENUM('IN_APP', 'EMAIL', 'WHATSAPP', 'ALL'),
                allowNull: false,
                defaultValue: 'IN_APP',
                comment: 'Channel through which the notification is delivered',
            },

            // ─── Delivery Status ───────────────────────────────────────
            status: {
                type: Sequelize.ENUM('PENDING', 'SENT', 'FAILED', 'READ'),
                allowNull: false,
                defaultValue: 'PENDING',
                comment: 'Current delivery / read state',
            },

            failure_reason: {
                type: Sequelize.STRING(255),
                allowNull: true,
                comment: 'Populated when status = FAILED (e.g. invalid email, WhatsApp error)',
            },

            // ─── Reference ─────────────────────────────────────────────
            reference_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'PK of the related record (AGM id, AR id, change request id, etc.)',
            },

            reference_type: {
                type: Sequelize.STRING(100),
                allowNull: true,
                comment: "Which table reference_id points to — e.g. 'AGM', 'AR', 'CEI', 'COMPANY'",
            },

            // ─── Timestamps ────────────────────────────────────────────
            scheduled_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'When the cron job should send this notification (NULL = immediate)',
            },

            sent_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Actual timestamp when notification was dispatched',
            },

            read_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Timestamp when the user opened or dismissed the notification',
            },

            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },

        });

        // ─── Indexes ──────────────────────────────────────────────────
        await queryInterface.addIndex(
            table('notifications'),
            ['recipient_user_id'],
            { name: 'idx_notif_recipient_user_id' }
        );

        await queryInterface.addIndex(
            table('notifications'),
            ['company_id'],
            { name: 'idx_notif_company_id' }
        );

        await queryInterface.addIndex(
            table('notifications'),
            ['type'],
            { name: 'idx_notif_type' }
        );

        await queryInterface.addIndex(
            table('notifications'),
            ['channel'],
            { name: 'idx_notif_channel' }
        );

        await queryInterface.addIndex(
            table('notifications'),
            ['status'],
            { name: 'idx_notif_status' }
        );

        await queryInterface.addIndex(
            table('notifications'),
            ['scheduled_at'],
            { name: 'idx_notif_scheduled_at' }
        );

        // Composite — cron query: fetch all PENDING notifications due to be sent
        await queryInterface.addIndex(
            table('notifications'),
            ['status', 'scheduled_at'],
            { name: 'idx_notif_status_scheduled' }
        );

        // Composite — unread badge count per user
        await queryInterface.addIndex(
            table('notifications'),
            ['recipient_user_id', 'status'],
            { name: 'idx_notif_user_status' }
        );

        // Composite — reference lookup (e.g. find all notifications for a specific AGM)
        await queryInterface.addIndex(
            table('notifications'),
            ['reference_type', 'reference_id'],
            { name: 'idx_notif_reference' }
        );

    },

    down: async (queryInterface, Sequelize) => {

        await queryInterface.dropTable(table('notifications'));

    },

};
