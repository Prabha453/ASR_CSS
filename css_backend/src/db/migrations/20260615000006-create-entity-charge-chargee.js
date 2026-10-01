'use strict';

const table = require('../../helper/dbTable');

/**
 * Migration: entity_charge_chargee
 *
 * Column names mirror the frontend chargee_ field names exactly
 * (with the chargee_ prefix stripped, since it is implicit from the table name).
 *
 * Frontend field name              DB column name (this file)
 * ──────────────────────────────── ──────────────────────────────
 * chargee_type                     chargee_type
 * chargee_company_entity_id              chargee_company_entity_id
 * chargee_individual_entity_id     chargee_individual_entity_id
 * chargee_secures_all_monies       chargee_secures_all_monies
 * chargee_currency                 chargee_currency
 * chargee_amount_secured           chargee_amount_secured
 */
module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('entity_charge_chargee'),
            {
                chargee_id: {
                    type:          Sequelize.INTEGER.UNSIGNED,
                    primaryKey:    true,
                    autoIncrement: true,
                    allowNull:     false,
                },

                /* Parent charge */
                charge_id: {
                    type:      Sequelize.INTEGER.UNSIGNED,
                    allowNull: false,
                    comment:   'FK → entity_charge.charge_id',
                },

                /* ── Chargee type ── */
                chargee_type: {
                    type:      Sequelize.STRING(5),
                    allowNull: true,
                    comment:   '1=Corporate, 2=Individual (frontend: chargee_type)',
                },

                chargee_company_entity_id: {
                    type:      Sequelize.STRING(255),
                    allowNull: true,
                    comment:   'Corporate entity name — required when chargee_type=1 (frontend: chargee_company_entity_id)',
                },

                /* ── Individual fields ── */
                chargee_individual_entity_id: {
                    type:      Sequelize.BIGINT.UNSIGNED,
                    allowNull: true,
                    comment:   'FK → entities.entity_id for the selected individual (frontend: chargee_individual_entity_id). Auto-filled on individual selection.',
                },

                /* ── Monies secured ── */
                chargee_secures_all_monies: {
                    type:      Sequelize.STRING(5),
                    allowNull: true,
                    comment:   '1=Yes, 2=No (frontend: chargee_secures_all_monies)',
                },

                chargee_currency: {
                    type:      Sequelize.STRING(10),
                    allowNull: true,
                    comment:   'Currency code — only set when chargee_secures_all_monies=2 (frontend: chargee_currency)',
                },

                chargee_amount_secured: {
                    type:      Sequelize.DECIMAL(20, 2),
                    allowNull: true,
                    comment:   'Amount secured — required when chargee_secures_all_monies=2 (frontend: chargee_amount_secured)',
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
            table('entity_charge_chargee'), ['charge_id'],
            { name: 'idx_entity_charge_chargee_charge_id' }
        );
        await queryInterface.addIndex(
            table('entity_charge_chargee'), ['chargee_type'],
            { name: 'idx_entity_charge_chargee_type' }
        );
        await queryInterface.addIndex(
            table('entity_charge_chargee'), ['chargee_individual_entity_id'],
            { name: 'idx_entity_charge_chargee_ind_entity_id' }
        );
        await queryInterface.addIndex(
            table('entity_charge_chargee'), ['is_deleted'],
            { name: 'idx_entity_charge_chargee_deleted' }
        );

        /* Composite — list query: charge_id + is_deleted */
        await queryInterface.addIndex(
            table('entity_charge_chargee'),
            ['charge_id', 'is_deleted'],
            { name: 'idx_entity_charge_chargee_charge_deleted' }
        );
    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('entity_charge_chargee'));
    },
};