'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        await queryInterface.createTable(table('audit_log'), {

            id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },

            user_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'NULL for system-triggered actions',
                references: {
                    model: table('users'),
                    key: 'user_id',
                },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            },

            module: {
                type: Sequelize.STRING(100),
                allowNull: true,
                comment: 'e.g. COMPANY, INDIVIDUAL, SHAREHOLDER, AUTH',
            },

            action: {
                type: Sequelize.STRING(150),
                allowNull: false,
                comment: 'e.g. CREATE_COMPANY, UPDATE_DIRECTOR, DELETE_SHARE',
            },

            table_name: {
                type: Sequelize.STRING(100),
                allowNull: true,
                comment: 'DB table that was modified',
            },

            record_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Primary key of the affected row',
            },

            old_values: {
                type: Sequelize.JSON,
                allowNull: true,
                comment: 'Row state BEFORE the change',
            },

            new_values: {
                type: Sequelize.JSON,
                allowNull: true,
                comment: 'Row state AFTER the change',
            },

            ip_address: {
                type: Sequelize.STRING(45),
                allowNull: true,
                comment: 'IPv4 or IPv6 of the requester',
            },

            user_agent: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Browser / client string from request header',
            },

            status: {
                type: Sequelize.ENUM('SUCCESS', 'FAILED'),
                allowNull: false,
                defaultValue: 'SUCCESS',
                comment: 'Whether the action completed successfully',
            },

            error_message: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Populated when status = FAILED',
            },

            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },

        });

        await queryInterface.addIndex(table('audit_log'), ['user_id'],    { name: 'idx_audit_user_id' });
        await queryInterface.addIndex(table('audit_log'), ['module'],     { name: 'idx_audit_module' });
        await queryInterface.addIndex(table('audit_log'), ['action'],     { name: 'idx_audit_action' });
        await queryInterface.addIndex(table('audit_log'), ['table_name'], { name: 'idx_audit_table_name' });
        await queryInterface.addIndex(table('audit_log'), ['record_id'],  { name: 'idx_audit_record_id' });
        await queryInterface.addIndex(table('audit_log'), ['status'],     { name: 'idx_audit_status' });
        await queryInterface.addIndex(table('audit_log'), ['created_at'], { name: 'idx_audit_created_at' });

    },

    down: async (queryInterface, Sequelize) => {

        await queryInterface.dropTable(table('audit_log'));

    },

};
