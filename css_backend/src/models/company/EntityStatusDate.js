'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class EntityStatusDate extends Model {

        static associate(models) {
            EntityStatusDate.belongsTo(models.entities, {
                foreignKey: 'entity_id',
                as: 'entity',
            });
            EntityStatusDate.belongsTo(models.entity_status, {
                foreignKey: 'e_status_id',
                as: 'entity_status',
            });
        }

    }

    EntityStatusDate.init(
        {
            history_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            entity_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            e_status_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                allowNull: true,
            },
            effective_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            remarks: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            is_deleted: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            created_date: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            created_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'entity_status_date',
            tableName: table('entity_status_date'),
            timestamps: false,
            underscored: true,
            indexes: [
                { fields: ['entity_id'],                  name: 'idx_esd_entity_model' },
                { fields: ['e_status_id'],                 name: 'idx_esd_status_model' },
                { fields: ['entity_id', 'e_status_id'],    name: 'uq_esd_entity_status_model', unique: true },
            ],
        }
    );

    return EntityStatusDate;
};
