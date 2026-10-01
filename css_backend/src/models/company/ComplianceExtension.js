'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class ComplianceExtension extends Model {
        static associate(models) {
            ComplianceExtension.belongsTo(models.company_event, {
                foreignKey: 'company_event_id',
                as: 'company_event',
            });
        }
    }

    ComplianceExtension.init(
        {
            extension_id: {
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
            extension_type: {
                type: DataTypes.STRING(20),
                allowNull: false,
            },
            action: {
                type: DataTypes.ENUM('EXTEND', 'CANCEL'),
                allowNull: false,
            },
            request_date: {
                type: DataTypes.DATE,
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
            previous_due_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            requested_due_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            approved_due_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            extension_days: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM('APPROVED', 'WITHDRAWN'),
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
            modelName: 'compliance_extension',
            tableName: table('compliance_extensions'),
            timestamps: false,
            underscored: true,
            indexes: [
                { fields: ['company_event_id'], name: 'idx_ce_company_event_id' },
                { fields: ['entity_id'], name: 'idx_ce_entity_id' },
                { fields: ['status'], name: 'idx_ce_status' },
            ],
        }
    );

    return ComplianceExtension;
};
