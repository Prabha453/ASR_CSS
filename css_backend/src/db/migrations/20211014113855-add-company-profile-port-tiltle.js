'use strict';

const table = require('../../helper/dbTable');

module.exports = {
    async up(queryInterface, Sequelize) {

        // ── Remove old columns ─────────────────────────────
        await queryInterface.removeColumn(
            table('company_profile'),
            'cp_profile_image'
        );

        await queryInterface.removeColumn(
            table('company_profile'),
            'cp_profile_image_url'
        );

        // ── Add new column after postal code ──────────────
        await queryInterface.addColumn(
            table('company_profile'),
            'cp_port_title',
            {
                type: Sequelize.STRING(500),
                allowNull: true,
                after: 'cp_reg_add_pcode',
            }
        );
    },

    async down(queryInterface, Sequelize) {

        // ── Remove new column ──────────────────────────────
        await queryInterface.removeColumn(
            table('company_profile'),
            'cp_port_title'
        );

        // ── Restore old columns ────────────────────────────
        await queryInterface.addColumn(
            table('company_profile'),
            'cp_profile_image',
            {
                type: Sequelize.STRING(300),
                allowNull: true,
            }
        );

        await queryInterface.addColumn(
            table('company_profile'),
            'cp_profile_image_url',
            {
                type: Sequelize.STRING(500),
                allowNull: true,
            }
        );
    },
};