'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class EntityCharge extends Model {

        static associate(models) {

            EntityCharge.hasMany(models.entity_charge_chargee, {
                foreignKey: 'charge_id',
                sourceKey: 'charge_id',
                as: 'chargees',
            });

        }

    }

    EntityCharge.init(
        {

            charge_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            company_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },

            charge_number: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },

            registration_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },

            lodgement_type: {
                type: DataTypes.STRING(10),
                allowNull: true,
            },

            instrument_executed_location: {
                type: DataTypes.STRING(5),
                allowNull: true,
            },

            charge_creation_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },

            instrument_option: {
                type: DataTypes.STRING(5),
                allowNull: true,
            },

            instrument_description: {
                type: DataTypes.STRING(10),
                allowNull: true,
            },

            instrument_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },

            instrument_executed_presence: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            property_description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            restrictions_prohibitions: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            salient_covenants: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            statement_lodged_behalf_of: {
                type: DataTypes.STRING(5),
                allowNull: true,
            },

            type_of_charge: {
                type: DataTypes.STRING(10),
                allowNull: true,
            },

            satisfaction_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },

            nature_of_satisfaction: {
                type: DataTypes.STRING(5),
                allowNull: true,
            },

            remarks: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            is_deleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },

            created_date: {
                type: DataTypes.DATE,
                allowNull: false,
            },

            created_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
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

            modelName: 'entity_charge',

            tableName: table('entity_charge'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',

            underscored: true,
        }
    );

    return EntityCharge;

};