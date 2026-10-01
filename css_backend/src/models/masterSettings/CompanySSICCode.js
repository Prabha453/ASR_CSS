'use strict';

const { Model } = require('sequelize');

const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class CompanySSICCode extends Model {

        static associate(models) {
            CompanySSICCode.belongsTo(models.countries, {
                foreignKey: 'country',
                targetKey: 'id',
                as: 'country_details',
            });
        }

    }

    CompanySSICCode.init(
        {

            ssic_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            ssic_code: {
                type: DataTypes.STRING(20),
                allowNull: false,
            },

            ssic_description: {
                type: DataTypes.STRING(500),
                allowNull: false,
            },

            country: {
                type: DataTypes.STRING(100),
                allowNull: false,
                defaultValue: 'Singapore',
            },

            country_code: {
                type: DataTypes.CHAR(3),
                allowNull: true,
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

            modelName: 'company_ssic_code',

            tableName: table('company_ssic_code'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',

            underscored: true,

            indexes: [
                {
                    unique: true,
                    fields: ['ssic_code', 'country_code'],
                    name: 'uq_ssic_code_country',
                },
                {
                    fields: ['ssic_code'],
                    name: 'idx_ssic_code',
                },
                {
                    fields: ['ssic_description'],
                    type: 'FULLTEXT',
                    name: 'ft_ssic_description',
                },
            ],
        }
    );

    return CompanySSICCode;

};