'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class OfficialRepresentative extends Model {
        static associate(models) {
            OfficialRepresentative.belongsTo(models.officials,  { foreignKey: 'official_id',              as: 'official' });
            OfficialRepresentative.belongsTo(models.entities,   { foreignKey: 'representative_entity_id', as: 'representative_entity' });
        }
    }

    OfficialRepresentative.init(
        {
            official_representaive_id: {   // keeping migration spelling
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            entity_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            official_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            representative_entity_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            representative_role: {
                type: DataTypes.ENUM('REPRESENTATIVE', 'ALTERNATE', 'PROXY', 'NOMINEE'),
                allowNull: false,
                defaultValue: 'REPRESENTATIVE',
            },
            appointment_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            ceased_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            is_appt_proposed: {
                type: DataTypes.TINYINT,
                allowNull: false,
                defaultValue: 1,
            },
            is_ceased_proposed: {
                type: DataTypes.TINYINT,
                allowNull: false,
                defaultValue: 1,
            },
            remarks: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            source_from: {
                type: DataTypes.ENUM('MANUAL', 'DM', 'BIZINSITE', 'WORKFLOW', 'API'),
                allowNull: false,
                defaultValue: 'MANUAL',
            },
            is_current: {
                type: DataTypes.TINYINT(1),
                allowNull: false,
                defaultValue: 1,
            },
            is_deleted: {
                type: DataTypes.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },
            created_date: { type: DataTypes.DATE, allowNull: true },
            created_by:   { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
            updated_date: { type: DataTypes.DATE, allowNull: true },
            updated_by:   { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        },
        {
            sequelize,
            modelName:  'official_representaive',   // matches migration spelling
            tableName:   table('official_representaive'),
            timestamps:  false,
            underscored: true,
        }
    );

    return OfficialRepresentative;
};
