'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class EntityShareDecimalSettings extends Model {

        static associate(models) {
            EntityShareDecimalSettings.belongsTo(models.entities, {
                foreignKey: 'entity_id',
                as: 'entity',
            });
        }

    }

    EntityShareDecimalSettings.init(
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            entity_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
            },
            no_of_share_decimal_place: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                defaultValue: null,
            },
            paid_up_share_decimal_place: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                defaultValue: null,
            },
            issued_share_decimal_place: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                defaultValue: null,
            },
        },
        {
            sequelize,
            modelName: 'entity_share_decimal_settings',
            tableName: table('entity_share_decimal_settings'),
            timestamps: false,
            underscored: true,
        }
    );

    return EntityShareDecimalSettings;
};
