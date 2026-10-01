'use strict';

const table = require('../../helper/dbTable');

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn(table('form_generation_artifacts'), 'artifact_type', {
            type: Sequelize.ENUM('HTML', 'PDF'), allowNull: false,
        });
        await queryInterface.changeColumn(table('form_generation_artifacts'), 'content_snapshot', {
            type: Sequelize.TEXT('long'), allowNull: true,
        });
        await queryInterface.addColumn(table('form_generation_artifacts'), 'document_store_id', {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
            references: { model: table('document_store'), key: 'doc_id' },
            onUpdate: 'CASCADE', onDelete: 'RESTRICT',
        });
        await queryInterface.addColumn(table('form_generation_artifacts'), 'file_size_bytes', {
            type: Sequelize.BIGINT.UNSIGNED, allowNull: true,
        });
        await queryInterface.addIndex(table('form_generation_artifacts'), ['document_store_id'], {
            name: 'idx_form_generation_artifact_document',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex(table('form_generation_artifacts'), 'idx_form_generation_artifact_document');
        await queryInterface.removeColumn(table('form_generation_artifacts'), 'file_size_bytes');
        await queryInterface.removeColumn(table('form_generation_artifacts'), 'document_store_id');
        await queryInterface.changeColumn(table('form_generation_artifacts'), 'content_snapshot', {
            type: Sequelize.TEXT('long'), allowNull: false,
        });
        await queryInterface.changeColumn(table('form_generation_artifacts'), 'artifact_type', {
            type: Sequelize.ENUM('HTML'), allowNull: false,
        });
    },
};
