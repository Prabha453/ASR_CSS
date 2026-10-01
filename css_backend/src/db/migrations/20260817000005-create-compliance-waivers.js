'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('compliance_waivers'), {
            waiver_id: {
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
            waiver_type: {
                type: Sequelize.ENUM('AGM_DISPENSE', 'AGM_EXEMPT', 'GENERAL'),
                allowNull: false,
            },
            action: {
                type: Sequelize.ENUM('APPLY', 'CANCEL'),
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
            effective_from: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            effective_to: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('APPROVED', 'CANCELLED'),
                allowNull: false,
                defaultValue: 'APPROVED',
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

        await queryInterface.addIndex(table('compliance_waivers'), ['company_event_id'], { name: 'idx_cw_company_event_id' });
        await queryInterface.addIndex(table('compliance_waivers'), ['entity_id'], { name: 'idx_cw_entity_id' });
        await queryInterface.addIndex(table('compliance_waivers'), ['waiver_type'], { name: 'idx_cw_waiver_type' });
        await queryInterface.addIndex(table('compliance_waivers'), ['status'], { name: 'idx_cw_status' });
    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('compliance_waivers'));
    },

};
