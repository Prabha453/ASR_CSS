'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('compliance_document_checklist_templates'), {
            checklist_template_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            event_master_id: {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: false,
            },
            document_name: {
                type: Sequelize.STRING(150),
                allowNull: false,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            is_mandatory: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            sort_order: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            is_deleted: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            created_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            created_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },
            updated_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            updated_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },
        });

        await queryInterface.addIndex(table('compliance_document_checklist_templates'), ['event_master_id'], { name: 'idx_cdct_event_master_id' });
    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('compliance_document_checklist_templates'));
    },

};
