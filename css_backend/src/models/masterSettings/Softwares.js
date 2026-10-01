'use strict';

const { Model } = require('sequelize');

const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class Software extends Model {

        static associate(models) {
            // no association
        }

    }

    Software.init(
        {

            software_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            software_name: {
                type: DataTypes.STRING(150),
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

            modelName: 'softwares',

            tableName: table('softwares'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',

            underscored: true,

            indexes: [
                {
                    fields: ['is_deleted'],
                    name: 'idx_software_deleted',
                },
            ],
        }
    );

    return Software;

};