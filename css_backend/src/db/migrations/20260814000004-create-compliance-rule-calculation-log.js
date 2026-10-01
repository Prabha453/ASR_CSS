'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('compliance_rule_calculation_log'), {
            calculation_log_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            company_event_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
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
            rule_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },
            rule_code: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },
            rule_version_no: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: true,
            },
            rule_phase: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            trigger_date_basis: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            trigger_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            base_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            computed_due_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            formula_steps: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            candidate_rules: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            selected_reason: {
                type: Sequelize.STRING(255),
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

        await queryInterface.addIndex(table('compliance_rule_calculation_log'), ['company_event_id'], { name: 'idx_crcl_company_event_id' });
        await queryInterface.addIndex(table('compliance_rule_calculation_log'), ['entity_id'], { name: 'idx_crcl_entity_id' });
        await queryInterface.addIndex(table('compliance_rule_calculation_log'), ['rule_id'], { name: 'idx_crcl_rule_id' });
    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('compliance_rule_calculation_log'));
    },

};
