'use strict';

const { Model } = require('sequelize');
const table = require('../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class UserGroup extends Model {

        static associate(models) {

            // User Group has many Users
            UserGroup.hasMany(models.user, {
                foreignKey: 'user_group_id',
                sourceKey: 'user_group_id',
                as: 'users',
            });

        }

    }

    UserGroup.init(
        {

            user_group_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            group_name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },

            group_description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            permissions_json: {
                type: DataTypes.JSON,
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

            modelName: 'user_group',

            tableName: table('user_group'),

            timestamps: false,

            createdAt: 'created_date',

            updatedAt: 'updated_date',

            underscored: true,
        }
    );

    return UserGroup;
};