'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        await queryInterface.createTable(table('login_history'), {

            id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },

            user_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                references: {
                    model: table('users'),
                    key: 'user_id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },

            login_status: {
                type: Sequelize.ENUM('SUCCESS', 'FAILED', 'LOCKED', 'LOGOUT'),
                allowNull: false,
                comment: 'Outcome of the login attempt or session end',
            },

            failure_reason: {
                type: Sequelize.ENUM(
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
                comment: 'Populated only when login_status = FAILED or LOCKED',
            },

            ip_address: {
                type: Sequelize.STRING(45),
                allowNull: true,
                comment: 'IPv4 or IPv6',
            },

            user_agent: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Browser / client string from request header',
            },

            session_id: {
                type: Sequelize.STRING(255),
                allowNull: true,
                comment: 'Links to cs_tokens.token for session tracking',
            },

            login_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                comment: 'Timestamp of the login attempt',
            },

            logout_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'NULL until user explicitly logs out or session expires',
            },

            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },

        });

        await queryInterface.addIndex(table('login_history'), ['user_id'],      { name: 'idx_login_user_id' });
        await queryInterface.addIndex(table('login_history'), ['login_status'],  { name: 'idx_login_status' });
        await queryInterface.addIndex(table('login_history'), ['ip_address'],    { name: 'idx_login_ip' });
        await queryInterface.addIndex(table('login_history'), ['login_at'],      { name: 'idx_login_at' });
        await queryInterface.addIndex(table('login_history'), ['session_id'],    { name: 'idx_login_session_id' });

    },

    down: async (queryInterface, Sequelize) => {

        await queryInterface.dropTable(table('login_history'));

    },

};
