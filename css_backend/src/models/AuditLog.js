'use strict';

const { Model } = require('sequelize');
const table = require('../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class AuditLog extends Model {

        static associate(models) {
            AuditLog.belongsTo(models.user, {
                foreignKey: 'user_id',
                targetKey: 'user_id',
                as: 'user',
            });
        }

    }

    AuditLog.init(
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },

            user_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

            module: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },

            action: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },

            table_name: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },

            record_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

            old_values: {
                type: DataTypes.JSON,
                allowNull: true,
            },

            new_values: {
                type: DataTypes.JSON,
                allowNull: true,
            },

            ip_address: {
                type: DataTypes.STRING(45),
                allowNull: true,
            },

            user_agent: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            status: {
                type: DataTypes.ENUM('SUCCESS', 'FAILED'),
                allowNull: false,
                defaultValue: 'SUCCESS',
            },

            error_message: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'audit_log',
            tableName: table('audit_log'),
            timestamps: false,
            underscored: true,
        }
    );

    return AuditLog;
};
