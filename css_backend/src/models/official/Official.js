'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class Official extends Model {
        static associate(models) {
            Official.belongsTo(models.entities, { foreignKey: 'entity_id',          as: 'entity' });
            Official.belongsTo(models.entities, { foreignKey: 'official_entity_id', as: 'official_entity' });
            Official.belongsTo(models.official_master, { foreignKey: 'official_master_id', as: 'official_master' });
            Official.hasOne( models.officials_date,         { foreignKey: 'official_id', as: 'date_record',  scope: { is_main_role: '1' } });
            Official.hasMany(models.officials_date,         { foreignKey: 'official_id', as: 'date_records' });
            Official.hasMany(models.official_representaive, { foreignKey: 'official_id', as: 'representatives' });
            Official.belongsTo(models.entity_identification, { foreignKey: 'identification_id', as: 'identification' });
            // Joint shareholder members — child rows referencing this record
            Official.hasMany(models.officials, { foreignKey: 'reference_official_id', as: 'joint_members' });
            Official.belongsTo(models.official_company_contact,{ foreignKey: 'company_contact_id', as: 'company_contact',});
        }
    }

    Official.init(
        {
            official_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            entity_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            official_entity_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            is_ref_id: {
                type: DataTypes.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },
            official_master_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                allowNull: false,
            },
            official_master_slug: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            official_type: {
                type: DataTypes.ENUM('COMPANY', 'INDIVIDUAL', 'JOINT', 'SUB_FUND'),
                allowNull: true,
            },
            identification_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            shareholder_type: {
                type: DataTypes.TINYINT.UNSIGNED,
                allowNull: true,
            },
            shareholder_property_type: {
                type: DataTypes.ENUM('NOMINEE', 'NON_NOMINEE', 'TRUST', 'BENEFICIAL', 'UMBRELLA', 'NON_UMBRELLA'),
                allowNull: true,
            },
            company_contact_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
            },
            reference_official_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            is_current: {
                type: DataTypes.TINYINT(1),
                allowNull: false,
                defaultValue: 1,
            },
            source_from: {
                type: DataTypes.ENUM('MANUAL', 'DM', 'BIZINSITE', 'WORKFLOW', 'API'),
                allowNull: false,
                defaultValue: 'MANUAL',
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
            modelName: 'officials',
            tableName:  table('officials'),
            timestamps: false,
            underscored: true,
        }
    );

    return Official;
};
