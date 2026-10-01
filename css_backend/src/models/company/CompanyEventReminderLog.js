'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {
    class CompanyEventReminderLog extends Model {
        static associate(models) {
            if (models.company_event) {
                CompanyEventReminderLog.belongsTo(models.company_event, {
                    foreignKey: 'company_event_id',
                    as: 'company_event',
                });
            }

            if (models.reminder) {
                CompanyEventReminderLog.belongsTo(models.reminder, {
                    foreignKey: 'reminder_id',
                    as: 'reminder',
                });
            }
        }
    }

    CompanyEventReminderLog.init(
        {
            log_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            company_event_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            reminder_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            scheduled_date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            sent_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM('PENDING', 'SENT', 'FAILED', 'SKIPPED'),
                allowNull: false,
                defaultValue: 'PENDING',
            },
            delivery_summary: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            delivery_details: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            subject_snapshot: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            message_snapshot: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
            },
            sender_email: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            email_config_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            reply_to_email: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            error_message: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            created_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            created_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            updated_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            updated_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'company_event_reminder_log',
            tableName: table('company_event_reminder_log'),
            timestamps: false,
            underscored: true,
        }
    );

    return CompanyEventReminderLog;
};
