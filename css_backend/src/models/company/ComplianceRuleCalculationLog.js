'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class ComplianceRuleCalculationLog extends Model {
        static associate(models) {
            ComplianceRuleCalculationLog.belongsTo(models.company_event, {
                foreignKey: 'company_event_id',
                as: 'company_event',
            });

            ComplianceRuleCalculationLog.belongsTo(models.company_event_rule, {
                foreignKey: 'rule_id',
                as: 'rule',
            });
        }
    }

    ComplianceRuleCalculationLog.init(
        {
            calculation_log_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            company_event_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
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
            rule_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            rule_code: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            rule_version_no: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
            },
            rule_phase: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            trigger_date_basis: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            trigger_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            base_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            computed_due_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            formula_steps: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            candidate_rules: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            selected_reason: {
                type: DataTypes.STRING(255),
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
            modelName: 'compliance_rule_calculation_log',
            tableName: table('compliance_rule_calculation_log'),
            timestamps: false,
            underscored: true,
            indexes: [
                { fields: ['company_event_id'], name: 'idx_crcl_company_event_id' },
                { fields: ['entity_id'], name: 'idx_crcl_entity_id' },
                { fields: ['rule_id'], name: 'idx_crcl_rule_id' },
            ],
        }
    );

    return ComplianceRuleCalculationLog;
};
