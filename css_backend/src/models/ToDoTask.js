'use strict';

const { Model } = require('sequelize');
const table = require('../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class ToDoTask extends Model {
        static associate(models) {
            ToDoTask.belongsTo(models.user, {
                foreignKey: 'user_id',
                targetKey: 'user_id',
                as: 'user',
            });
        }
    }

    ToDoTask.init(
        {
            todo_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            user_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },

            task_text: {
                type: DataTypes.TEXT,
                allowNull: false,
            },

            status: {
                type: DataTypes.ENUM('PENDING', 'COMPLETED'),
                allowNull: false,
                defaultValue: 'PENDING',
            },

            is_deleted: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            created_date: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },

            updated_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'todo_tasks',
            tableName: table('todo_tasks'),
            timestamps: false,
        }
    );

    return ToDoTask;
};
