'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class OfficialDate extends Model {
        static associate(models) {
            OfficialDate.belongsTo(models.officials, { foreignKey: 'official_id', as: 'official' });
        }
    }

    OfficialDate.init(
        {
            official_date_id: {
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
            official_master_slug: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            is_main_role: {
                type: DataTypes.ENUM('0', '1'),
                allowNull: false,
                defaultValue: '1',
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
            officials_appt_from: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            officials_ceased_from: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            appt_manual: {
                type: DataTypes.TINYINT(1),
                allowNull: false,
                defaultValue: 1,
            },
            ceased_manual: {
                type: DataTypes.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },
            source_from: {
                type: DataTypes.ENUM('MANUAL', 'DM', 'BIZINSITE', 'WORKFLOW', 'API'),
                allowNull: false,
                defaultValue: 'MANUAL',
            },
            remarks: {
                type: DataTypes.TEXT,
                allowNull: true,
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
            modelName:  'officials_date',
            tableName:   table('officials_date'),
            timestamps:  false,
            underscored: true,
        }
    );

    return OfficialDate;
};
