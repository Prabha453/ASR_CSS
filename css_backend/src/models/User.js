'use strict';

const { Model } = require('sequelize');
const table = require('../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class User extends Model {

        static associate(models) {

            User.belongsTo(models.user_group, {
                foreignKey: 'user_group_id',
                targetKey: 'user_group_id',
                as: 'group',
            });

            User.hasOne(models.user_permission, {
                foreignKey: 'user_id',
                sourceKey: 'user_id',
                as: 'permission',
            });

        }

    }

    User.init(
        {

            user_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            user_role: {
                type: DataTypes.ENUM(
                    'SUPER_ADMIN',
                    'ADMIN',
                    'MANAGER',
                    'STAFF',
                    'VIEWER',
                    'CLIENT'
                ),
                defaultValue: 'STAFF',
            },

            user_group_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
            },

            first_name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },

            last_name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },

            department: {
                type: DataTypes.STRING(150),
                allowNull: true,
            },

            designation: {
                type: DataTypes.STRING(150),
                allowNull: true,
            },

            whatsapp_no: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },

            whatsapp_otp: {
                type: DataTypes.STRING(10),
                allowNull: true,
            },

            whatsapp_otp_created_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            email: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },

            email_otp: {
                type: DataTypes.STRING(10),
                allowNull: true,
            },

            email_otp_created_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            user_name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },

            user_password: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },

            password_salt: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },

            zoom_account_email: {
                type: DataTypes.STRING(200),
                allowNull: true,
            },

            zoom_account_password: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },

            zoom_client_id: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },

            zoom_client_secret: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },

            zoom_access_token: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            zoom_token_expiry: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            user_status: {
                type: DataTypes.ENUM(
                    'ACTIVE',
                    'INACTIVE',
                    'SUSPENDED',
                    'PENDING'
                ),
                defaultValue: 'PENDING',
            },

            password_session_timeout: {
                type: DataTypes.INTEGER.UNSIGNED,
                defaultValue: 30,
            },

            psd_timeout_count: {
                type: DataTypes.TINYINT.UNSIGNED,
                defaultValue: 0,
            },

            password_renewal_days: {
                type: DataTypes.SMALLINT.UNSIGNED,
                defaultValue: 90,
            },

            password_last_changed: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            google_calendar_key: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            twofa_enabled: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },

            twofa_secret: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },

            join_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },

            last_login_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            last_login_ip: {
                type: DataTypes.STRING(45),
                allowNull: true,
            },

            profile_photo_url: {
                type: DataTypes.STRING(500),
                allowNull: true,
            },

            is_deleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },

            created_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

            updated_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

        },
        {
            sequelize,

            modelName: 'user',

            tableName: table('users'),

            timestamps: false,

            createdAt: 'created_date',

            updatedAt: 'updated_date',

            underscored: true,
        }
    );

    return User;
};