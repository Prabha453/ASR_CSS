'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class CompanyType extends Model {

        static associate(models) {
            // no association
        }

    }

    CompanyType.init(
        {

            company_type_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            company_type_name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },

            company_type_order: {
                type: DataTypes.SMALLINT.UNSIGNED,
                allowNull: false,
                defaultValue: 0,
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

            modelName: 'company_type',

            tableName: table('company_type'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',

            underscored: true,

            indexes: [
                {
                    fields: ['is_deleted'],
                    name: 'idx_company_type_deleted',
                },
            ],
        }
    );

    return CompanyType;
};