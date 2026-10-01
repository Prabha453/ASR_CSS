'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class EntityChargeChargee extends Model {

        static associate(models) {

            EntityChargeChargee.belongsTo(models.entity_charge, {
                foreignKey: 'charge_id',
                targetKey: 'charge_id',
                as: 'charge',
            });

        }

    }

    EntityChargeChargee.init(
        {

            chargee_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            charge_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
            },

            chargee_type: {
                type: DataTypes.STRING(5),
                allowNull: true,
            },

            chargee_company_entity_id: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },

            chargee_individual_entity_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

            chargee_secures_all_monies: {
                type: DataTypes.STRING(5),
                allowNull: true,
            },

            chargee_currency: {
                type: DataTypes.STRING(10),
                allowNull: true,
            },

            chargee_amount_secured: {
                type: DataTypes.DECIMAL(20, 2),
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

            modelName: 'entity_charge_chargee',

            tableName: table('entity_charge_chargee'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',

            underscored: true,
        }
    );

    return EntityChargeChargee;

};