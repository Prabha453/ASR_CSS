'use strict';

const table = require('../../helper/dbTable');

/**
 * Migration: entity_charge
 *
 * Column names mirror the frontend Formik field names exactly.
 * This eliminates the mapping layer in the service —
 * body.field_name writes directly to the same-named DB column.
 *
 * Frontend field name          DB column name (this file)
 * ──────────────────────────── ──────────────────────────
 * company_id                   company_id          (FK → entities.entity_id)
 * charge_number                charge_number
 * registration_date            registration_date
 * lodgement_type               lodgement_type
 * instrument_executed_location instrument_executed_location
 * charge_creation_date         charge_creation_date
 * instrument_option            instrument_option
 * instrument_description       instrument_description
 * instrument_date              instrument_date
 * instrument_executed_presence instrument_executed_presence
 * property_description         property_description
 * restrictions_prohibitions    restrictions_prohibitions
 * salient_covenants            salient_covenants
 * statement_lodged_behalf_of   statement_lodged_behalf_of
 * type_of_charge               type_of_charge
 * satisfaction_date            satisfaction_date
 * nature_of_satisfaction       nature_of_satisfaction
 * remarks                      remarks
 */
module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('entity_charge'),
            {
                charge_id: {
                    type:          Sequelize.INTEGER.UNSIGNED,
                    primaryKey:    true,
                    autoIncrement: true,
                    allowNull:     false,
                    comment:       'Primary key',
                },

                /* ── Company that owns this charge ── */
                company_id: {
                    type:      Sequelize.BIGINT.UNSIGNED,
                    allowNull: false,
                    comment:   'FK → entities.entity_id  (frontend: company_id)',
                },

                /* ── Basic information ── */
                charge_number: {
                    type:      Sequelize.STRING(50),
                    allowNull: false,
                    comment:   'Charge Number (frontend: charge_number). Pattern: ^[1-9][0-9]*$',
                },

                registration_date: {
                    type:      Sequelize.DATEONLY,
                    allowNull: true,
                    comment:   'Registration Date (frontend: registration_date)',
                },

                lodgement_type: {
                    type:      Sequelize.STRING(10),
                    allowNull: true,
                    comment:   'Type of Lodgement — stored value: 1–4 (frontend: lodgement_type)',
                },

                /* ── Instrument and its execution ── */
                instrument_executed_location: {
                    type:      Sequelize.STRING(5),
                    allowNull: true,
                    comment:   '1=In Singapore, 2=Outside Singapore (frontend: instrument_executed_location)',
                },

                charge_creation_date: {
                    type:      Sequelize.DATEONLY,
                    allowNull: true,
                    comment:   'Date charge was signed / created (frontend: charge_creation_date)',
                },

                instrument_option: {
                    type:      Sequelize.STRING(5),
                    allowNull: true,
                    comment:   '1=No instrument, 2=There is instrument (frontend: instrument_option)',
                },

                instrument_description: {
                    type:      Sequelize.STRING(10),
                    allowNull: true,
                    comment:   'Description of Instrument, values 1–20 (frontend: instrument_description)',
                },

                instrument_date: {
                    type:      Sequelize.DATEONLY,
                    allowNull: true,
                    comment:   'Date of Instrument (frontend: instrument_date)',
                },

                instrument_executed_presence: {
                    type:      Sequelize.TEXT,
                    allowNull: true,
                    comment:   'Charge Instrument Executed in the Presence of (frontend: instrument_executed_presence)',
                },

                property_description: {
                    type:      Sequelize.TEXT,
                    allowNull: true,
                    comment:   'Short Description of Property Securing the Charge (frontend: property_description)',
                },

                restrictions_prohibitions: {
                    type:      Sequelize.TEXT,
                    allowNull: true,
                    comment:   'Restrictions / Prohibitions (frontend: restrictions_prohibitions)',
                },

                salient_covenants: {
                    type:      Sequelize.TEXT,
                    allowNull: true,
                    comment:   'Salient Covenants of Terms and Conditions in the Debentures (frontend: salient_covenants)',
                },

                /* ── Lodgement information ── */
                statement_lodged_behalf_of: {
                    type:      Sequelize.STRING(5),
                    allowNull: true,
                    comment:   '1=Chargee, 2=Chargor, 3=Person interested (frontend: statement_lodged_behalf_of)',
                },

                type_of_charge: {
                    type:      Sequelize.STRING(10),
                    allowNull: true,
                    comment:   'Type of Charge, values 1–10 (frontend: type_of_charge)',
                },

                satisfaction_date: {
                    type:      Sequelize.DATEONLY,
                    allowNull: true,
                    comment:   'Date of Satisfaction — must be > registration_date (frontend: satisfaction_date)',
                },

                nature_of_satisfaction: {
                    type:      Sequelize.STRING(5),
                    allowNull: true,
                    comment:   'Nature of Satisfaction, values 1–6 (frontend: nature_of_satisfaction)',
                },

                remarks: {
                    type:      Sequelize.TEXT,
                    allowNull: true,
                    comment:   'Remarks (frontend: remarks)',
                },

                /* ── Soft delete + audit ── */
                is_deleted: {
                    type:         Sequelize.BOOLEAN,
                    allowNull:    false,
                    defaultValue: false,
                },

                created_date: {
                    type:         Sequelize.DATE,
                    allowNull:    false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },

                created_by: {
                    type:      Sequelize.BIGINT.UNSIGNED,
                    allowNull: true,
                },

                updated_date: {
                    type:      Sequelize.DATE,
                    allowNull: true,
                },

                updated_by: {
                    type:      Sequelize.BIGINT.UNSIGNED,
                    allowNull: true,
                },
            }
        );

        /* ── Indexes ── */
        await queryInterface.addIndex(
            table('entity_charge'), ['company_id'],
            { name: 'idx_entity_charge_company_id' }
        );
        await queryInterface.addIndex(
            table('entity_charge'), ['charge_number'],
            { name: 'idx_entity_charge_number' }
        );
        await queryInterface.addIndex(
            table('entity_charge'), ['registration_date'],
            { name: 'idx_entity_charge_registration_date' }
        );
        await queryInterface.addIndex(
            table('entity_charge'), ['is_deleted'],
            { name: 'idx_entity_charge_deleted' }
        );

        /* Composite — used for duplicate-number check (company_id + charge_number + is_deleted) */
        await queryInterface.addIndex(
            table('entity_charge'),
            ['company_id', 'charge_number', 'is_deleted'],
            { name: 'idx_entity_charge_company_number_deleted' }
        );
    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('entity_charge'));
    },
};