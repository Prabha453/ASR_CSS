'use strict';

const { Model } = require('sequelize');

const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class CompanySegregation extends Model {

        static associate(models) {
            // no association
        }

    }

    CompanySegregation.init(
        {

            segregation_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            segregation_name: {
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

            modelName: 'company_segregation',

            tableName: table('company_segregation'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',

            underscored: true,

            indexes: [
                {
                    fields: ['is_deleted'],
                    name: 'idx_segregation_deleted',
                },
            ],
        }
    );

    return CompanySegregation;

};