'use strict';

const table = require('../../helper/dbTable');

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(table('form_generation_runs'), 'template_content_snapshot', {
            type: Sequelize.TEXT('long'), allowNull: true,
        });
        await queryInterface.addColumn(table('form_generation_runs'), 'layout_snapshot', {
            type: Sequelize.JSON, allowNull: true,
        });
        await queryInterface.addColumn(table('form_generation_runs'), 'template_fields_snapshot', {
            type: Sequelize.JSON, allowNull: true,
        });
        await queryInterface.createTable(table('form_generation_artifacts'), {
            generation_artifact_id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            generation_run_id: {
                type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
                references: { model: table('form_generation_runs'), key: 'generation_run_id' },
                onUpdate: 'CASCADE', onDelete: 'RESTRICT',
            },
            artifact_type: { type: Sequelize.ENUM('HTML'), allowNull: false },
            content_snapshot: { type: Sequelize.TEXT('long'), allowNull: false },
            content_hash: { type: Sequelize.STRING(64), allowNull: false },
            created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex(table('form_generation_artifacts'), ['generation_run_id', 'artifact_type'], {
            name: 'uq_form_generation_artifact_type', unique: true,
        });
        await queryInterface.addIndex(table('form_generation_artifacts'), ['content_hash'], {
            name: 'idx_form_generation_artifact_hash',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('form_generation_artifacts'));
        await queryInterface.removeColumn(table('form_generation_runs'), 'layout_snapshot');
        await queryInterface.removeColumn(table('form_generation_runs'), 'template_fields_snapshot');
        await queryInterface.removeColumn(table('form_generation_runs'), 'template_content_snapshot');
    },
};
