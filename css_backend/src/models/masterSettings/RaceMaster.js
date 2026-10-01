'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class RaceMaster extends Model {

        static associate(models) {
            // no association
        }

    }

    RaceMaster.init(
        {

            race_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            race_name: {
                type: DataTypes.STRING(100),
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

            modelName: 'race_master',

            tableName: table('race_master'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',

            underscored: true,
        }
    );

    return RaceMaster;
};