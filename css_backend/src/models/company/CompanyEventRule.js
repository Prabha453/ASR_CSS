'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class CompanyEventRule extends Model {
        static associate(models) {
            CompanyEventRule.belongsTo(models.company_event_name, {
                foreignKey: 'event_id',
                as: 'event',
            });

            CompanyEventRule.belongsTo(models.company_event_rule, {
                foreignKey: 'superseded_by_rule_id',
                as: 'superseded_by',
            });

            CompanyEventRule.belongsTo(models.jurisdiction, {
                foreignKey: 'jurisdiction_id',
                as: 'jurisdiction',
            });
        }
    }

    CompanyEventRule.init(
        {
            rule_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            event_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                allowNull: false,
            },
            event_slug: {
                type: DataTypes.STRING(80),
                allowNull: false,
            },
            country_ids: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            jurisdiction_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            legacy_country_ids: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            company_type_ids: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            rule_config: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            is_deleted: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            rule_code: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            version_no: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                defaultValue: 1,
            },
            version_status: {
                type: DataTypes.ENUM('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'SUPERSEDED', 'RETIRED'),
                allowNull: false,
                defaultValue: 'DRAFT',
            },
            effective_from: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            effective_to: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            rule_priority: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            submitted_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            submitted_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            approved_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            approved_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            published_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            published_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            retired_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            retired_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            superseded_by_rule_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            created_date: {
                type: DataTypes.DATE,
                allowNull: true,
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
            modelName: 'company_event_rule',
            tableName: table('company_event_rule'),
            timestamps: false,
            underscored: true,
            indexes: [
                { fields: ['event_id'], name: 'idx_csr_event_id' },
                { fields: ['event_slug'], name: 'idx_csr_event_slug' },
                { fields: ['is_active', 'is_deleted'], name: 'idx_csr_active_deleted' },
                { fields: ['rule_code'], name: 'idx_csr_rule_code' },
                { fields: ['version_status'], name: 'idx_csr_version_status' },
                { fields: ['effective_from', 'effective_to'], name: 'idx_csr_effective' },
                { fields: ['jurisdiction_id'], name: 'idx_csr_jurisdiction_id' },
            ],
        }
    );

    return CompanyEventRule;
};
