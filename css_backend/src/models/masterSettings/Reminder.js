'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class Reminder extends Model {

        static associate(models) {

            if (models.company_event_name) {
                Reminder.belongsTo(models.company_event_name, {
                    foreignKey: 'event_id',
                    targetKey: 'e_id',
                    as: 'event',
                });
            }

            if (models.company_type) {
                Reminder.belongsTo(models.company_type, {
                    foreignKey: 'company_type_id',
                    targetKey: 'company_type_id',
                    as: 'company_type_info',
                });
            }

        }

    }

    Reminder.init(
        {

            reminder_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            category: {
                type: DataTypes.ENUM('EVENT', 'LOG'),
                allowNull: false,
                defaultValue: 'EVENT',
            },

            event_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                allowNull: true,
            },

            company_type_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

            status: {
                type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
                allowNull: false,
                defaultValue: 'ACTIVE',
            },

            timing_type: {
                type: DataTypes.ENUM('BEFORE', 'AFTER'),
                allowNull: false,
                defaultValue: 'BEFORE',
            },

            offset_days: {
                type: DataTypes.SMALLINT.UNSIGNED,
                allowNull: false,
                defaultValue: 0,
            },

            is_recurring: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            recurring_interval_type: {
                type: DataTypes.ENUM('DAILY', 'CUSTOM'),
                allowNull: true,
            },

            recurring_interval_days: {
                type: DataTypes.SMALLINT.UNSIGNED,
                allowNull: true,
                defaultValue: 1,
            },

            sender_name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },

            subject: {
                type: DataTypes.TEXT,
                allowNull: false,
            },

            message: {
                type: DataTypes.TEXT('long'),
                allowNull: false,
            },

            is_deleted: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
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

            modelName: 'reminder',

            tableName: table('reminder'),

            timestamps: false,

            createdAt: false,

            updatedAt: false,

            underscored: true,
        }
    );

    return Reminder;
};
