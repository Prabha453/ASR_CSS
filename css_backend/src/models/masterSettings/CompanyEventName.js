'use strict';

const { Model } = require('sequelize');

const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class CompanyEventName extends Model {

        static associate(models) {
            CompanyEventName.hasMany(models.company_event_rule, {
                foreignKey: 'event_id',
                as: 'event_rules',
            });

            CompanyEventName.hasMany(models.company_event, {
                foreignKey: 'event_id',
                as: 'events',
            });

            CompanyEventName.belongsTo(models.authority, {
                foreignKey: 'authority_id',
                as: 'authority',
            });
        }

    }

    CompanyEventName.init(
        {

            e_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            event_type: {
                type: DataTypes.STRING(20),
                allowNull: false,
                defaultValue: 'EVENT',
                comment: 'EVENT = Event, LOG = Log',
            },

            event_name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },

            event_slug: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },

            event_subject: {
                type: DataTypes.STRING(300),
                allowNull: true,
            },

            color_code: {
                type: DataTypes.STRING(10),
                allowNull: false,
                defaultValue: '#3788D8',
            },

            is_system_event: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            is_recurring: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            recurring_period: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                defaultValue: 0,
            },

            recurring_duration: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },

            operational_lead_days: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                defaultValue: 7,
            },

            grace_period_days: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                defaultValue: 0,
            },

            is_deleted: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            category: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },

            authority_type: {
                type: DataTypes.STRING(80),
                allowNull: true,
            },

            authority_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

            default_frequency: {
                type: DataTypes.ENUM('ONE_TIME', 'ANNUAL', 'SEMI_ANNUAL', 'QUARTERLY', 'MONTHLY', 'AD_HOC'),
                allowNull: true,
            },

            supports_extension: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            supports_waiver: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            evidence_required: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
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

            modelName: 'company_event_name',

            tableName: table('company_event_name'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',

            underscored: true,

            indexes: [
                {
                    fields: ['event_type'],
                    name: 'idx_event_name_type',
                },
                {
                    fields: ['event_slug'],
                    name: 'idx_event_name_slug',
                },
                {
                    fields: ['is_deleted'],
                    name: 'idx_event_name_deleted',
                },
                {
                    fields: ['category'],
                    name: 'idx_event_name_category',
                },
            ],
        }
    );

    return CompanyEventName;

};
