'use strict';

const { Model } = require('sequelize');
const table = require('../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class LoginHistory extends Model {

        static associate(models) {
            LoginHistory.belongsTo(models.user, {
                foreignKey: 'user_id',
                targetKey:  'user_id',
                as:         'user',
            });
        }

    }

    LoginHistory.init(
        {
            id: {
                type:          DataTypes.BIGINT.UNSIGNED,
                primaryKey:    true,
                autoIncrement: true,
                allowNull:     false,
            },

            user_id: {
                type:      DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },

            login_status: {
                type:      DataTypes.ENUM('SUCCESS', 'FAILED', 'LOCKED', 'LOGOUT'),
                allowNull: false,
            },

            failure_reason: {
                type:      DataTypes.ENUM(
                    'WRONG_PASSWORD',
                    'ACCOUNT_INACTIVE',
                    'ACCOUNT_SUSPENDED',
                    'ACCOUNT_LOCKED',
                    'OTP_EXPIRED',
                    'OTP_INVALID',
                    'TOKEN_EXPIRED',
                    'TOKEN_BLACKLISTED'
                ),
                allowNull: true,
            },

            ip_address: {
                type:      DataTypes.STRING(45),
                allowNull: true,
            },

            user_agent: {
                type:      DataTypes.TEXT,
                allowNull: true,
            },

            session_id: {
                type:      DataTypes.STRING(255),
                allowNull: true,
            },

            login_at: {
                type:      DataTypes.DATE,
                allowNull: false,
            },

            logout_at: {
                type:      DataTypes.DATE,
                allowNull: true,
            },

            created_at: {
                type:      DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'login_history',
            tableName: table('login_history'),
            timestamps: false,
            underscored: true,
        }
    );

    return LoginHistory;
};
