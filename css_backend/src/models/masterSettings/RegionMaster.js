'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class RegionMaster extends Model {

        static associate(models) {

        }

    }

    RegionMaster.init(
        {

            region_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            region_name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },

            is_deleted: {
                type: DataTypes.BOOLEAN,
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

            modelName: 'region_master',

            tableName: table('region_master'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',

            underscored: true,

            indexes: [
                {
                    fields: ['is_deleted'],
                    name: 'idx_region_deleted',
                },
            ],
        }
    );

    return RegionMaster;
};