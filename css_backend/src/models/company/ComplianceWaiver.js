'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class ComplianceWaiver extends Model {
        static associate(models) {
            ComplianceWaiver.belongsTo(models.company_event, {
                foreignKey: 'company_event_id',
                as: 'company_event',
            });
        }
    }

    ComplianceWaiver.init(
        {
            waiver_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            company_event_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            entity_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            event_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                allowNull: false,
            },
            event_slug: {
                type: DataTypes.STRING(80),
                allowNull: false,
            },
            waiver_type: {
                type: DataTypes.ENUM('AGM_DISPENSE', 'AGM_EXEMPT', 'GENERAL'),
                allowNull: false,
            },
            action: {
                type: DataTypes.ENUM('APPLY', 'CANCEL'),
                allowNull: false,
            },
            reason: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            authority: {
                type: DataTypes.STRING(150),
                allowNull: true,
            },
            reference: {
                type: DataTypes.STRING(150),
                allowNull: true,
            },
            effective_from: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            effective_to: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM('APPROVED', 'CANCELLED'),
                allowNull: false,
                defaultValue: 'APPROVED',
            },
            decision_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            decision_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            created_date: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            created_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'compliance_waiver',
            tableName: table('compliance_waivers'),
            timestamps: false,
            underscored: true,
            indexes: [
                { fields: ['company_event_id'], name: 'idx_cw_company_event_id' },
                { fields: ['entity_id'], name: 'idx_cw_entity_id' },
                { fields: ['waiver_type'], name: 'idx_cw_waiver_type' },
                { fields: ['status'], name: 'idx_cw_status' },
            ],
        }
    );

    return ComplianceWaiver;
};
