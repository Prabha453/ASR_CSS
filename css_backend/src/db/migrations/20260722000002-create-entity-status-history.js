'use strict';

const table = require('../../helper/dbTable');

// Legacy status-driven columns on entity_company_details being retired in favour
// of one entity_status_date row per (entity_id, e_status_id) pair. Each maps to
// the entity_status name(s) it was used for (some names shared one legacy column,
// e.g. Liquidation/Liquidated).
const LEGACY_COLUMN_STATUS_MAP = [
    { column: 'dormant_date',           statusNames: ['Dormant (Reminder Sending)'] },
    { column: 'strike_off_date',        statusNames: ['Striking Off'] },
    { column: 'terminate_date',         statusNames: ['Terminated'] },
    { column: 'liquidated_date',        statusNames: ['Liquidation', 'Liquidated'] },
    { column: 'cancelled_date',         statusNames: ['Cancelled'] },
    { column: 'amalgamated_date',       statusNames: ['Amalgamated'] },
    { column: 'liquid_strike_off_date', statusNames: ['Dissolved', 'Struck-Off'] },
];

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('entity_status_date'), {
            history_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            entity_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
            },
            e_status_id: {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: true,
            },
            effective_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            remarks: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            is_deleted: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },
            created_date: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            created_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },
        });

        await queryInterface.addIndex(table('entity_status_date'), ['entity_id'],   { name: 'idx_esd_entity' });
        await queryInterface.addIndex(table('entity_status_date'), ['e_status_id'], { name: 'idx_esd_status' });
        await queryInterface.addIndex(table('entity_status_date'), ['is_deleted'],  { name: 'idx_esd_deleted' });

        // One row per status per company — create()/update() upsert on this key.
        await queryInterface.addIndex(table('entity_status_date'), ['entity_id', 'e_status_id'], {
            name: 'uq_esd_entity_status',
            unique: true,
        });

        await queryInterface.addConstraint(table('entity_status_date'), {
            fields: ['entity_id'],
            type: 'foreign key',
            name: 'fk_esd_entity',
            references: { table: table('entities'), field: 'entity_id' },
            onDelete: 'CASCADE',
        });

        await queryInterface.addConstraint(table('entity_status_date'), {
            fields: ['e_status_id'],
            type: 'foreign key',
            name: 'fk_esd_status',
            references: { table: table('entity_status'), field: 'e_status_id' },
            onDelete: 'SET NULL',
        });

        // ── Backfill: one row per legacy column whose implied status matches
        //    the entity's current e_status_id at migration time. ──
        for (const { column, statusNames } of LEGACY_COLUMN_STATUS_MAP) {
            const placeholders = statusNames.map(() => '?').join(', ');
            await queryInterface.sequelize.query(
                `INSERT INTO ${table('entity_status_date')}
                    (entity_id, e_status_id, effective_date, remarks, created_date)
                 SELECT d.entity_id, d.e_status_id, d.${column}, 'Migrated from legacy ${column} column', NOW()
                 FROM ${table('entity_company_details')} d
                 JOIN ${table('entity_status')} s ON s.e_status_id = d.e_status_id
                 WHERE d.${column} IS NOT NULL AND s.e_status_name IN (${placeholders})`,
                { replacements: statusNames }
            );
        }
    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('entity_status_date'));
    },

};
