'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class ComplianceDocumentChecklistTemplate extends Model {
        static associate(models) {
            ComplianceDocumentChecklistTemplate.belongsTo(models.company_event_name, {
                foreignKey: 'event_master_id',
                as: 'event',
            });
        }
    }

    ComplianceDocumentChecklistTemplate.init(
        {
            checklist_template_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            event_master_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                allowNull: false,
            },
            document_name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            is_mandatory: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            sort_order: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            is_deleted: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
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
            modelName: 'compliance_document_checklist_template',
            tableName: table('compliance_document_checklist_templates'),
            timestamps: false,
            underscored: true,
            indexes: [
                { fields: ['event_master_id'], name: 'idx_cdct_event_master_id' },
            ],
        }
    );

    return ComplianceDocumentChecklistTemplate;
};
