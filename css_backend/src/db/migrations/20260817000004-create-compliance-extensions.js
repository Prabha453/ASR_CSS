'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('compliance_extensions'), {
            extension_id: {
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
            extension_type: {
                type: Sequelize.STRING(20),
                allowNull: false,
                comment: 'AGM | AR | ANNUAL_FILING | GENERAL',
            },
            action: {
                type: Sequelize.ENUM('EXTEND', 'CANCEL'),
                allowNull: false,
            },
            request_date: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            reason: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            authority: {
                type: Sequelize.STRING(150),
                allowNull: true,
            },
            reference: {
                type: Sequelize.STRING(150),
                allowNull: true,
            },
            previous_due_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            requested_due_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            approved_due_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            extension_days: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'Signed: positive for EXTEND, negative for CANCEL',
            },
            status: {
                type: Sequelize.ENUM('APPROVED', 'WITHDRAWN'),
                allowNull: false,
                defaultValue: 'APPROVED',
                comment: 'Narrow by design — self-service actions auto-approve. WITHDRAWN is reserved for a future pending-approval workflow.',
            },
            decision_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            decision_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },
            created_date: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            created_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },
        });

        await queryInterface.addIndex(table('compliance_extensions'), ['company_event_id'], { name: 'idx_ce_company_event_id' });
        await queryInterface.addIndex(table('compliance_extensions'), ['entity_id'], { name: 'idx_ce_entity_id' });
        await queryInterface.addIndex(table('compliance_extensions'), ['status'], { name: 'idx_ce_status' });
    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('compliance_extensions'));
    },

};
