'use strict';

const table = require('../../helper/dbTable');

module.exports = {
    up: async (queryInterface, Sequelize) => {

        await queryInterface.createTable(table('users'), {

            user_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },

            user_role: {
                type: Sequelize.ENUM(
                    'SUPER_ADMIN',
                    'ADMIN',
                    'MANAGER',
                    'STAFF',
                    'VIEWER',
                    'CLIENT'
                ),
                allowNull: false,
                defaultValue: 'STAFF',
            },

            user_group_id: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: true,
                references: {
                    model: table('user_group'),
                    key: 'user_group_id',
                },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            },

            first_name: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },

            last_name: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },

            department: {
                type: Sequelize.STRING(150),
                allowNull: true,
            },

            designation: {
                type: Sequelize.STRING(150),
                allowNull: true,
            },

            whatsapp_no: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },

            whatsapp_otp: {
                type: Sequelize.STRING(10),
                allowNull: true,
            },

            whatsapp_otp_created_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },

            email: {
                type: Sequelize.STRING(200),
                allowNull: false,
                unique: true,
            },

            email_otp: {
                type: Sequelize.STRING(10),
                allowNull: true,
            },

            email_otp_created_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },

            user_name: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true,
            },

            user_password: {
                type: Sequelize.STRING(255),
                allowNull: false,
                comment: 'bcrypt hash',
            },

            password_salt: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },

            zoom_account_email: {
                type: Sequelize.STRING(200),
                allowNull: true,
            },

            zoom_account_password: {
                type: Sequelize.STRING(255),
                allowNull: true,
                comment: 'Encrypted',
            },

            zoom_client_id: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },

            zoom_client_secret: {
                type: Sequelize.STRING(255),
                allowNull: true,
                comment: 'Encrypted',
            },

            zoom_access_token: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Encrypted OAuth token',
            },

            zoom_token_expiry: {
                type: Sequelize.DATE,
                allowNull: true,
            },

            user_status: {
                type: Sequelize.ENUM(
                    'ACTIVE',
                    'INACTIVE',
                    'SUSPENDED',
                    'PENDING'
                ),
                allowNull: false,
                defaultValue: 'PENDING',
            },

            password_session_timeout: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false,
                defaultValue: 30,
                comment: 'Minutes',
            },

            psd_timeout_count: {
                type: Sequelize.TINYINT.UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                comment: 'Failed attempts',
            },

            password_renewal_days: {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: false,
                defaultValue: 90,
            },

            password_last_changed: {
                type: Sequelize.DATE,
                allowNull: true,
            },

            google_calendar_key: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'OAuth credential JSON',
            },

            twofa_enabled: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },

            twofa_secret: {
                type: Sequelize.STRING(255),
                allowNull: true,
                comment: 'TOTP secret, encrypted',
            },

            join_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },

            last_login_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },

            last_login_ip: {
                type: Sequelize.STRING(45),
                allowNull: true,
                comment: 'IPv4 or IPv6',
            },

            profile_photo_url: {
                type: Sequelize.STRING(500),
                allowNull: true,
            },

            is_deleted: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },

            created_date: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },

            created_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },

            updated_date: {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: Sequelize.literal(
                    'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
                ),
            },

            updated_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },

        });

        // INDEXES
        await queryInterface.addIndex(
            table('users'),
            ['user_role'],
            {
                name: 'idx_user_role',
            }
        );

        await queryInterface.addIndex(
            table('users'),
            ['user_status'],
            {
                name: 'idx_user_status',
            }
        );

        await queryInterface.addIndex(
            table('users'),
            ['user_group_id'],
            {
                name: 'idx_user_group',
            }
        );

        await queryInterface.addIndex(
            table('users'),
            ['is_deleted'],
            {
                name: 'idx_user_deleted',
            }
        );
    },

    down: async (queryInterface, Sequelize) => {

        await queryInterface.dropTable(table('users'));
        
        // Remove ENUM types (PostgreSQL support)
        // await queryInterface.sequelize.query(
        //     'DROP TYPE IF EXISTS "enum_cs_users_user_role";'
        // );

        // await queryInterface.sequelize.query(
        //     'DROP TYPE IF EXISTS "enum_cs_users_user_status";'
        // );
    },
};