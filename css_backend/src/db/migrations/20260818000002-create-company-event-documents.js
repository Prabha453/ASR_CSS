'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('company_event_documents'), {
            event_document_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            company_event_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
            },
            entity_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
            },
            event_id: {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: false,
            },
            event_slug: {
                type: Sequelize.STRING(80),
                allowNull: false,
            },
            checklist_template_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },
            document_name: {
                type: Sequelize.STRING(150),
                allowNull: false,
            },
            is_mandatory: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            status: {
                type: Sequelize.ENUM('REQUIRED', 'REQUESTED', 'RECEIVED', 'APPROVED', 'REJECTED', 'EXPIRED', 'NOT_APPLICABLE'),
                allowNull: false,
                defaultValue: 'REQUIRED',
            },
            doc_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },
            remarks: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            reviewed_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },
            reviewed_date: {
                type: Sequelize.DATE,
                allowNull: true,
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

        await queryInterface.addIndex(table('company_event_documents'), ['company_event_id'], { name: 'idx_ced_company_event_id' });
        await queryInterface.addIndex(table('company_event_documents'), ['status'], { name: 'idx_ced_status' });
    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('company_event_documents'));
    },

};
