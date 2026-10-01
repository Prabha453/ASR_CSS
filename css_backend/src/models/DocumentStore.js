'use strict';

const { Model } = require('sequelize');
const table = require('../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class DocumentStore extends Model {

        static associate(models) {

            DocumentStore.belongsTo(models.document_store, {
                foreignKey: 'parent_doc_id',
                targetKey:  'doc_id',
                as:         'parentDocument',
            });

            DocumentStore.hasMany(models.document_store, {
                foreignKey: 'parent_doc_id',
                sourceKey:  'doc_id',
                as:         'childVersions',
            });

            DocumentStore.belongsTo(models.company_profile, {
                foreignKey: 'module_record_id',
                targetKey:  'cp_id',
                as:         'companyProfile',
                constraints: false,
            });

        }

    }

    DocumentStore.init(
        {
            doc_id: {
                type:          DataTypes.BIGINT.UNSIGNED,
                primaryKey:    true,
                autoIncrement: true,
            },

            // ── ✅ NEW: Port ID from logged-in user ────────────────────────
            port_number: {
                type:         DataTypes.BIGINT.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
                comment:      'Port/tenant ID from logged-in user — used to scope documents per port',
            },

            // ── Entity Link ────────────────────────────────────────────────
            entity_id: {
                type:      DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },

            entity_type: {
                type:         DataTypes.STRING(50),
                allowNull:    false,
                defaultValue: 'company',
            },

            module_name: {
                type:      DataTypes.STRING(100),
                allowNull: true,
            },

            sub_module_name: {
                type:      DataTypes.STRING(100),
                allowNull: true,
            },

            module_record_id: {
                type:      DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

            // ── Document Meta ──────────────────────────────────────────────
            doc_category: {
                type:      DataTypes.STRING(100),
                allowNull: false,
            },

            original_file_name: {
                type:      DataTypes.STRING(300),
                allowNull: false,
            },

            stored_file_name: {
                type:      DataTypes.STRING(300),
                allowNull: false,
            },

            doc_name: {
                type:      DataTypes.STRING(300),
                allowNull: false,
            },

            doc_type: {
                type:      DataTypes.STRING(20),
                allowNull: true,
            },

            mime_type: {
                type:      DataTypes.STRING(100),
                allowNull: true,
            },

            file_size_kb: {
                type:      DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
            },

            file_hash: {
                type:      DataTypes.STRING(64),
                allowNull: true,
            },

            // ── Storage ────────────────────────────────────────────────────
            storage_type: {
                type:         DataTypes.TINYINT,
                allowNull:    false,
                defaultValue: 0,
                comment:      '0 = local server | 1 = AWS S3',
            },

            // ✅ Stores FULL URL: e.g. http://localhost:5000/asr_css/uploads/…
            file_path: {
                type:      DataTypes.STRING(600),
                allowNull: false,
            },

            bucket_name: {
                type:      DataTypes.STRING(150),
                allowNull: true,
            },

            s3_region: {
                type:      DataTypes.STRING(50),
                allowNull: true,
            },

            cdn_url: {
                type:      DataTypes.STRING(700),
                allowNull: true,
            },

            presigned_expires_at: {
                type:      DataTypes.DATE,
                allowNull: true,
            },

            // ── Dates / Versioning ─────────────────────────────────────────
            doc_date: {
                type:      DataTypes.DATEONLY,
                allowNull: true,
            },

            expiry_date: {
                type:      DataTypes.DATEONLY,
                allowNull: true,
            },

            version_no: {
                type:         DataTypes.SMALLINT.UNSIGNED,
                allowNull:    false,
                defaultValue: 1,
            },

            parent_doc_id: {
                type:      DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

            // ── Links ──────────────────────────────────────────────────────
            company_event_id: {
                type:      DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

            template_category_id: {
                type:      DataTypes.SMALLINT.UNSIGNED,
                allowNull: true,
            },

            // ── Classification ─────────────────────────────────────────────
            tags: {
                type:      DataTypes.JSON,
                allowNull: true,
            },

            description: {
                type:      DataTypes.TEXT,
                allowNull: true,
            },

            remarks: {
                type:      DataTypes.TEXT,
                allowNull: true,
            },

            is_confidential: {
                type:         DataTypes.BOOLEAN,
                defaultValue: false,
            },

            access_level: {
                type:         DataTypes.TINYINT.UNSIGNED,
                defaultValue: 0,
                comment:      '0=all | 1=admin | 2=superadmin',
            },

            // ── Upload Tracking ────────────────────────────────────────────
            upload_status: {
                type:         DataTypes.ENUM('pending', 'completed', 'failed'),
                defaultValue: 'completed',
            },

            upload_ip: {
                type:      DataTypes.STRING(45),
                allowNull: true,
            },

            // ── Soft Delete & Audit ────────────────────────────────────────
            is_deleted: {
                type:         DataTypes.BOOLEAN,
                defaultValue: false,
            },

            deleted_at: {
                type:      DataTypes.DATE,
                allowNull: true,
            },

            deleted_by: {
                type:      DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

            created_by: {
                type:      DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

            updated_by: {
                type:      DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName:  'document_store',
            tableName:  table('document_store'),
            timestamps: true,
            createdAt:  'created_date',
            updatedAt:  'updated_date',
            underscored: true,
        }
    );

    return DocumentStore;
};