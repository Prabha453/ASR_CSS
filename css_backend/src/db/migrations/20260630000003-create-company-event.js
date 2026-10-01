'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable(table('company_event'), {
            company_event_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
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
            year_of_fye: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            period_start: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            period_end: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            actual_year: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            actual_fye: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            fye_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            base_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            sent_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            received_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            held_time: {
                type: Sequelize.TIME,
                allowNull: true,
            },
            held_time_end: {
                type: Sequelize.TIME,
                allowNull: true,
            },
            venue_type: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            venue: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            meeting_chairman: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            type_shareholder: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            meeting_corporate_shareholder_rep: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            meeting_agenda: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            sender_email: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            reply_to_email: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            agm_status_details: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            group_to_recipient: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            email_config_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },
            recurring_period: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: true,
            },
            recurring_duration: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            extended_due_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            remarks: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            due_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            held_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            filing_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('PENDING', 'COMPLETED', 'WAIVED', 'CANCELLED'),
                allowNull: false,
                defaultValue: 'PENDING',
            },
            source_from: {
                type: Sequelize.ENUM('AUTO_RULE', 'MANUAL', 'IMPORT'),
                allowNull: false,
                defaultValue: 'AUTO_RULE',
            },
            source_basis: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            generated_from_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            attendees: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            receiving_parties: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            reminders: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            uploaded_files: {
                type: Sequelize.JSON,
                allowNull: true,
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

        await queryInterface.addIndex(table('company_event'), ['entity_id'], { name: 'idx_cse_entity_id' });
        await queryInterface.addIndex(table('company_event'), ['event_id'], { name: 'idx_cse_event_id' });
        await queryInterface.addIndex(table('company_event'), ['event_slug'], { name: 'idx_cse_event_slug' });
        await queryInterface.addIndex(table('company_event'), ['due_date'], { name: 'idx_cse_due_date' });
        await queryInterface.addIndex(table('company_event'), ['status'], { name: 'idx_cse_status' });
        await queryInterface.addIndex(table('company_event'), ['is_deleted'], { name: 'idx_cse_deleted' });
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable(table('company_event'));
    },
};
