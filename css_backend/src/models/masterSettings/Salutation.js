'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class Salutation extends Model {

        static associate(models) {
            // no association
        }

    }

    Salutation.init(
        {

            salutation_id: {
                type: DataTypes.TINYINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            salutation_name: {
                type: DataTypes.STRING(50),
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

            modelName: 'salutation',

            tableName: table('salutation'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',

            underscored: true,
        }
    );

    return Salutation;
};