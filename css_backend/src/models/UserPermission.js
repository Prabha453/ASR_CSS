'use strict';

const { Model } = require('sequelize');
const table = require('../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class UserPermission extends Model {

        static associate(models) {
            UserPermission.belongsTo(models.user, {
                foreignKey: 'user_id',
                targetKey: 'user_id',
                as: 'user',
            });
        }

    }

    UserPermission.init(
        {
            user_perm_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            user_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },

            permissions_json: {
                type: DataTypes.TEXT,
                allowNull: true,
                get() {
                    const raw = this.getDataValue('permissions_json');
                    if (!raw) return {};
                    try { return JSON.parse(raw); } catch { return {}; }
                },
                set(val) {
                    if (!val) {
                        this.setDataValue('permissions_json', null);
                    } else if (typeof val === 'string') {
                        this.setDataValue('permissions_json', val);
                    } else {
                        this.setDataValue('permissions_json', JSON.stringify(val));
                    }
                },
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
            modelName: 'user_permission',
            tableName: table('user_permission'),
            timestamps: false,
            createdAt: 'created_date',
            updatedAt: 'updated_date',
            underscored: true,
        }
    );

    return UserPermission;
};
