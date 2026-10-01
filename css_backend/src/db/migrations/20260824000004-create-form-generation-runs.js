'use strict';

const table = require('../../helper/dbTable');

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(table('form_generation_runs'), {
            generation_run_id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            idempotency_key: { type: Sequelize.STRING(128), allowNull: false },
            request_hash: { type: Sequelize.STRING(64), allowNull: false },
            form_id: {
                type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
                references: { model: table('forms'), key: 'form_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
            },
            template_version_id: {
                type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
                references: { model: table('form_template_versions'), key: 'template_version_id' },
                onUpdate: 'CASCADE', onDelete: 'RESTRICT',
            },
            entity_id: {
                type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
                references: { model: table('entities'), key: 'entity_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
            },
            lifecycle_status: {
                type: Sequelize.ENUM('VALIDATING', 'READY', 'RENDERING', 'COMPLETED', 'FAILED'),
                allowNull: false, defaultValue: 'VALIDATING',
            },
            template_content_hash: { type: Sequelize.STRING(64), allowNull: false },
            selection_snapshot: { type: Sequelize.JSON, allowNull: false },
            resolved_snapshot: { type: Sequelize.JSON, allowNull: false },
            popup_schema_snapshot: { type: Sequelize.JSON, allowNull: false },
            failure_code: { type: Sequelize.STRING(80), allowNull: true },
            failure_message: { type: Sequelize.STRING(1000), allowNull: true },
            created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
            completed_at: { type: Sequelize.DATE, allowNull: true },
        });
        await queryInterface.addIndex(table('form_generation_runs'), ['idempotency_key'], {
            name: 'uq_form_generation_runs_idempotency', unique: true,
        });
        await queryInterface.addIndex(table('form_generation_runs'), ['form_id', 'created_at'], {
            name: 'idx_form_generation_runs_form_created',
        });
        await queryInterface.addIndex(table('form_generation_runs'), ['entity_id', 'created_at'], {
            name: 'idx_form_generation_runs_entity_created',
        });
        await queryInterface.addIndex(table('form_generation_runs'), ['template_version_id'], {
            name: 'idx_form_generation_runs_version',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('form_generation_runs'));
    },
};
