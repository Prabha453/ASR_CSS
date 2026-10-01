'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('todo_tasks'), {

            todo_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },

            user_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
            },

            task_text: {
                type: Sequelize.TEXT,
                allowNull: false,
            },

            status: {
                type: Sequelize.ENUM('PENDING', 'COMPLETED'),
                allowNull: false,
                defaultValue: 'PENDING',
            },

            is_deleted: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            created_date: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },

            updated_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },

        });

        await queryInterface.addIndex(table('todo_tasks'), ['user_id'], {
            name: 'idx_todo_task_user',
        });

        await queryInterface.addConstraint(table('todo_tasks'), {
            fields: ['user_id'],
            type: 'foreign key',
            name: 'fk_todo_task_user',
            references: { table: table('users'), field: 'user_id' },
            onDelete: 'CASCADE',
        });

    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('todo_tasks'));
    },

};
