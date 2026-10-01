'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        // ── cs_officials ──────────────────────────────────────────────────────

        // Remove old officer_type column
        await queryInterface.removeColumn(table('officials'), 'officer_type');

        // Add official_type ENUM('COMPANY', 'INDIVIDUAL')
        await queryInterface.addColumn(table('officials'), 'official_type', {
            type: Sequelize.ENUM('COMPANY', 'INDIVIDUAL'),
            allowNull: true,
            after: 'official_master_id',
        });

        await queryInterface.addIndex(table('officials'), ['official_type'], {
            name: 'idx_official_type',
        });

        // ── cs_officials_date ─────────────────────────────────────────────────

        await queryInterface.addColumn(table('officials_date'), 'official_master_slug', {
            type: Sequelize.STRING(100),
            allowNull: true,
            after: 'official_id',
        });

        await queryInterface.addColumn(table('officials_date'), 'is_main_role', {
            type: Sequelize.ENUM('0', '1'),
            allowNull: false,
            defaultValue: '1',
            after: 'official_master_slug',
        });

        await queryInterface.addColumn(table('officials_date'), 'is_appt_proposed', {
            type: Sequelize.TINYINT,
            allowNull: false,
            defaultValue: 1,
            after: 'ceased_date',
        });

        await queryInterface.addColumn(table('officials_date'), 'is_appt_effective', {
            type: Sequelize.TINYINT,
            allowNull: false,
            defaultValue: 0,
            after: 'is_appt_proposed',
        });

        await queryInterface.addColumn(table('officials_date'), 'is_ceased_proposed', {
            type: Sequelize.TINYINT,
            allowNull: false,
            defaultValue: 1,
            after: 'is_appt_effective',
        });

        await queryInterface.addColumn(table('officials_date'), 'is_ceased_effective', {
            type: Sequelize.TINYINT,
            allowNull: false,
            defaultValue: 0,
            after: 'is_ceased_proposed',
        });

        await queryInterface.addColumn(table('officials_date'), 'pe_appointment_date', {
            type: Sequelize.DATEONLY,
            allowNull: true,
            after: 'is_ceased_effective',
        });

        await queryInterface.addColumn(table('officials_date'), 'pe_ceased_date', {
            type: Sequelize.DATEONLY,
            allowNull: true,
            after: 'pe_appointment_date',
        });

        await queryInterface.addIndex(table('officials_date'), ['official_master_slug'], {
            name: 'idx_od_master_slug',
        });

        await queryInterface.addIndex(table('officials_date'), ['is_main_role'], {
            name: 'idx_od_main_role',
        });
    },

    async down(queryInterface, Sequelize) {

        // Reverse cs_officials_date
        await queryInterface.removeIndex(table('officials_date'), 'idx_od_main_role');
        await queryInterface.removeIndex(table('officials_date'), 'idx_od_master_slug');
        await queryInterface.removeColumn(table('officials_date'), 'pe_ceased_date');
        await queryInterface.removeColumn(table('officials_date'), 'pe_appointment_date');
        await queryInterface.removeColumn(table('officials_date'), 'is_ceased_effective');
        await queryInterface.removeColumn(table('officials_date'), 'is_ceased_proposed');
        await queryInterface.removeColumn(table('officials_date'), 'is_appt_effective');
        await queryInterface.removeColumn(table('officials_date'), 'is_appt_proposed');
        await queryInterface.removeColumn(table('officials_date'), 'is_main_role');
        await queryInterface.removeColumn(table('officials_date'), 'official_master_slug');

        // Reverse cs_officials
        await queryInterface.removeIndex(table('officials'), 'idx_official_type');
        await queryInterface.removeColumn(table('officials'), 'official_type');
        await queryInterface.addColumn(table('officials'), 'officer_type', {
            type: Sequelize.STRING(100),
            allowNull: true,
        });
    },
};
