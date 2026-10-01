'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class CompanyEventDocument extends Model {
        static associate(models) {
            CompanyEventDocument.belongsTo(models.company_event, {
                foreignKey: 'company_event_id',
                as: 'company_event',
            });
        }
    }

    CompanyEventDocument.init(
        {
            event_document_id: {
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
            checklist_template_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            document_name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },
            is_mandatory: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            status: {
                type: DataTypes.ENUM('REQUIRED', 'REQUESTED', 'RECEIVED', 'APPROVED', 'REJECTED', 'EXPIRED', 'NOT_APPLICABLE'),
                allowNull: false,
                defaultValue: 'REQUIRED',
            },
            doc_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            remarks: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            reviewed_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            reviewed_date: {
                type: DataTypes.DATE,
                allowNull: true,
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
            modelName: 'company_event_document',
            tableName: table('company_event_documents'),
            timestamps: false,
            underscored: true,
            indexes: [
                { fields: ['company_event_id'], name: 'idx_ced_company_event_id' },
                { fields: ['status'], name: 'idx_ced_status' },
            ],
        }
    );

    return CompanyEventDocument;
};
