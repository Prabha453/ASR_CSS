'use strict';

const { Model } = require('sequelize');

const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class EntityStatus extends Model {

        static associate(models) {
            // no association
        }

    }

    EntityStatus.init(
        {

            e_status_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            e_status_name: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },

            is_deleted: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            updated_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            updated_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

        },
        {
            sequelize,

            modelName: 'entity_status',

            tableName: table('entity_status'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',

            underscored: true,

            indexes: [
                {
                    fields: ['is_deleted'],
                    name: 'idx_e_status_deleted',
                },
            ],
        }
    );

    return EntityStatus;

};