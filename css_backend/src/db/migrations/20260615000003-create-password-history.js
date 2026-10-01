'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        await queryInterface.createTable(table('password_history'), {

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

            password_hash: {
                type: Sequelize.STRING(255),
                allowNull: false,
                comment: 'bcrypt hash of the OLD password — used to prevent reuse',
            },

            change_reason: {
                type: Sequelize.ENUM(
                    'USER_CHANGE',
                    'ADMIN_RESET',
                    'FORCED_RENEWAL',
                    'FORGOT_PASSWORD'
                ),
                allowNull: false,
                comment: 'Why the password was changed',
            },

            changed_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'user_id of who made the change (self or admin)',
                references: {
                    model: table('users'),
                    key: 'user_id',
                },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            },

            ip_address: {
                type: Sequelize.STRING(45),
                allowNull: true,
                comment: 'IP from which the password was changed',
            },

            user_agent: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Browser / client string at the time of change',
            },

            changed_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                comment: 'Timestamp the password was changed',
            },

            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },

        });

        await queryInterface.addIndex(table('password_history'), ['user_id'],   { name: 'idx_pwdhist_user_id' });
        await queryInterface.addIndex(table('password_history'), ['changed_at'], { name: 'idx_pwdhist_changed_at' });
        await queryInterface.addIndex(table('password_history'), ['change_reason'], { name: 'idx_pwdhist_reason' });

    },

    down: async (queryInterface, Sequelize) => {

        await queryInterface.dropTable(table('password_history'));

    },

};
