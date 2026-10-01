'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('document_store'),
            {

                doc_id: {
                    type: Sequelize.BIGINT.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                // ─────────────────────────────────────────────
                // Entity Link
                // ─────────────────────────────────────────────

                entity_id: {
                    type: Sequelize.BIGINT.UNSIGNED,
                    allowNull: false,
                },

                entity_type: {
                    type: Sequelize.STRING(50),
                    allowNull: false,
                    defaultValue: 'company',
                    comment: 'company | member | director | shareholder',
                },

                module_name: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                    comment: 'company_document | kyc | agm | shares',
                },

                sub_module_name: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                },

                module_record_id: {
                    type: Sequelize.BIGINT.UNSIGNED,
                    allowNull: true,
                    comment: 'PK of parent record in the module table',
                },

                // ─────────────────────────────────────────────
                // Document Meta
                // ─────────────────────────────────────────────

                doc_category: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                    comment: 'CONSTITUTION | RESOLUTION | CERT | KYC',
                },

                original_file_name: {
                    type: Sequelize.STRING(300),
                    allowNull: false,
                    comment: 'Original filename from client',
                },

                stored_file_name: {
                    type: Sequelize.STRING(300),
                    allowNull: false,
                    comment: 'UUID-based name on disk / S3',
                },

                doc_name: {
                    type: Sequelize.STRING(300),
                    allowNull: false,
                    comment: 'Display / logical name',
                },

                doc_type: {
                    type: Sequelize.STRING(20),
                    allowNull: true,
                    comment: 'pdf | docx | xlsx | jpg',
                },

                mime_type: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                },

                file_size_kb: {
                    type: Sequelize.INTEGER.UNSIGNED,
                    allowNull: true,
                },

                file_hash: {
                    type: Sequelize.STRING(64),
                    allowNull: true,
                    comment: 'SHA-256 for dedup / integrity',
                },

                // ─────────────────────────────────────────────
                // Storage
                // ─────────────────────────────────────────────

                storage_type: {
                    type: Sequelize.TINYINT(1),
                    allowNull: false,
                    defaultValue: 0,
                    comment: '0 = local server | 1 = AWS S3',
                },

                file_path: {
                    type: Sequelize.STRING(600),
                    allowNull: false,
                    comment: 'Relative local path OR S3 object key',
                },

                bucket_name: {
                    type: Sequelize.STRING(150),
                    allowNull: true,
                    comment: 'S3 bucket (storage_type=1 only)',
                },

                s3_region: {
                    type: Sequelize.STRING(50),
                    allowNull: true,
                },

                cdn_url: {
                    type: Sequelize.STRING(700),
                    allowNull: true,
                    comment: 'CloudFront/CDN URL for S3 objects',
                },

                presigned_expires_at: {
                    type: Sequelize.DATE,
                    allowNull: true,
                    comment: 'Cached presigned URL expiry',
                },

                // ─────────────────────────────────────────────
                // Dates / Versioning
                // ─────────────────────────────────────────────

                doc_date: {
                    type: Sequelize.DATEONLY,
                    allowNull: true,
                },

                expiry_date: {
                    type: Sequelize.DATEONLY,
                    allowNull: true,
                },

                version_no: {
                    type: Sequelize.SMALLINT.UNSIGNED,
                    allowNull: false,
                    defaultValue: 1,
                },

                parent_doc_id: {
                    type: Sequelize.BIGINT.UNSIGNED,
                    allowNull: true,
                    comment: 'Previous version self-ref',
                    references: {
                        model: table('document_store'),
                        key: 'doc_id',
                    },
                    onDelete: 'SET NULL',
                },

                // ─────────────────────────────────────────────
                // Links
                // ─────────────────────────────────────────────

                company_event_id: {
                    type: Sequelize.BIGINT.UNSIGNED,
                    allowNull: true,
                },

                template_category_id: {
                    type: Sequelize.SMALLINT.UNSIGNED,
                    allowNull: true,
                },

                // ─────────────────────────────────────────────
                // Classification
                // ─────────────────────────────────────────────

                tags: {
                    type: Sequelize.JSON,
                    allowNull: true,
                },

                description: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },

                remarks: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },

                is_confidential: {
                    type: Sequelize.TINYINT(1),
                    allowNull: false,
                    defaultValue: 0,
                },

                access_level: {
                    type: Sequelize.TINYINT.UNSIGNED,
                    allowNull: false,
                    defaultValue: 0,
                    comment: '0=all | 1=admin | 2=superadmin',
                },

                // ─────────────────────────────────────────────
                // Upload Tracking
                // ─────────────────────────────────────────────

                upload_status: {
                    type: Sequelize.STRING(20),
                    allowNull: false,
                    defaultValue: 'completed',
                    comment: 'pending | completed | failed',
                },

                upload_ip: {
                    type: Sequelize.STRING(45),
                    allowNull: true,
                },

                // ─────────────────────────────────────────────
                // Soft Delete + Audit
                // ─────────────────────────────────────────────

                is_deleted: {
                    type: Sequelize.TINYINT(1),
                    allowNull: false,
                    defaultValue: 0,
                },

                deleted_at: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },

                deleted_by: {
                    type: Sequelize.BIGINT.UNSIGNED,
                    allowNull: true,
                },

                created_date: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue:
                        Sequelize.literal('CURRENT_TIMESTAMP'),
                },

                created_by: {
                    type: Sequelize.BIGINT.UNSIGNED,
                    allowNull: true,
                },

                updated_date: {
                    type: Sequelize.DATE,
                    allowNull: true,
                    defaultValue:
                        Sequelize.literal(
                            'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
                        ),
                },

                updated_by: {
                    type: Sequelize.BIGINT.UNSIGNED,
                    allowNull: true,
                },

            }
        );

        // ─────────────────────────────────────────────
        // Indexes
        // ─────────────────────────────────────────────

        await queryInterface.addIndex(
            table('document_store'),
            ['entity_id', 'entity_type'],
            {
                name: 'idx_doc_entity',
            }
        );

        await queryInterface.addIndex(
            table('document_store'),
            ['module_name', 'module_record_id'],
            {
                name: 'idx_doc_module',
            }
        );

        await queryInterface.addIndex(
            table('document_store'),
            ['doc_category'],
            {
                name: 'idx_doc_category',
            }
        );

        await queryInterface.addIndex(
            table('document_store'),
            ['storage_type'],
            {
                name: 'idx_doc_storage',
            }
        );

        await queryInterface.addIndex(
            table('document_store'),
            ['expiry_date'],
            {
                name: 'idx_doc_expiry',
            }
        );

        await queryInterface.addIndex(
            table('document_store'),
            ['is_deleted'],
            {
                name: 'idx_doc_deleted',
            }
        );

        await queryInterface.addIndex(
            table('document_store'),
            ['upload_status'],
            {
                name: 'idx_doc_upload_status',
            }
        );

        await queryInterface.addIndex(
            table('document_store'),
            ['file_hash'],
            {
                name: 'idx_doc_hash',
            }
        );

    },

    async down(queryInterface) {

        await queryInterface.dropTable(
            table('document_store')
        );

    },

};