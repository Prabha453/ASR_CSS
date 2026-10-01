'use strict';

const table = require('../../helper/dbTable');

module.exports = {
    up: async (queryInterface, Sequelize) => {

        await queryInterface.createTable(table('user_permission'), {

            user_perm_id: {
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

            /*
             * Sparse JSON — only modules/actions that are explicitly overridden.
             * If a module.action is absent → inherit from the user's group.
             * true  → explicitly GRANT  (even if group denies)
             * false → explicitly REVOKE (even if group grants)
             */
            permissions_json: {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: null,
                comment: 'Sparse user-level permission overrides. Absent key = inherit from group.',
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
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
            },

            updated_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },
        });

        await queryInterface.addIndex(
            table('user_permission'),
            ['user_id'],
            { name: 'idx_user_perm_user_id', unique: true }
        );

        await queryInterface.addIndex(
            table('user_permission'),
            ['is_deleted'],
            { name: 'idx_user_perm_deleted' }
        );
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable(table('user_permission'));
    },
};
