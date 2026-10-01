'use strict';

const { Model } = require('sequelize');

const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class Countries extends Model {

        static associate(models) {

            Countries.hasMany(models.company_ssic_code, {
                foreignKey: 'country',
                sourceKey: 'id',
                as: 'company_ssic_codes',
            });
        }

    }

    Countries.init(
        {

            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            iso: {
                type: DataTypes.CHAR(2),
                allowNull: false,
            },

            acra_iso: {
                type: DataTypes.STRING(5),
                allowNull: false,
            },

            name: {
                type: DataTypes.STRING(80),
                allowNull: false,
            },

            country_name: {
                type: DataTypes.STRING(80),
                allowNull: false,
            },

            nationality: {
                type: DataTypes.STRING(255),
                allowNull: true,
                defaultValue: null,
            },

            iso3: {
                type: DataTypes.CHAR(3),
                allowNull: true,
                defaultValue: null,
            },

            currency_string: {
                type: DataTypes.STRING(100),
                allowNull: true,
                defaultValue: null,
            },

            currency_code: {
                type: DataTypes.STRING(3),
                allowNull: true,
                defaultValue: null,
            },

            numcode: {
                type: DataTypes.SMALLINT,
                allowNull: true,
                defaultValue: null,
            },

            phonecode: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            phone_length: {
                type: DataTypes.STRING(55),
                allowNull: false,
            },

            region_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            addr_format: {
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: null,
            },

            is_delete: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: '1-YES, 0-NO',
            },

        },
        {
            sequelize,

            modelName: 'countries',

            tableName: table('countries'),

            timestamps: false,

            underscored: true,

            indexes: [
                {
                    fields: ['iso'],
                    name: 'idx_countries_iso',
                },
                {
                    fields: ['iso3'],
                    name: 'idx_countries_iso3',
                },
                {
                    fields: ['currency_code'],
                    name: 'idx_countries_currency_code',
                },
                {
                    fields: ['is_delete'],
                    name: 'idx_countries_is_delete',
                },
            ],
        }
    );

    return Countries;

};