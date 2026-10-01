'use strict';

const table = require('../../helper/dbTable');

module.exports = {
    async up(queryInterface, Sequelize) {
        const definitionTable = table('form_shortcode_definitions');
        await queryInterface.addColumn(definitionTable, 'sort_order', {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 1,
        });

        // Preserve the library's previous alphabetical order, numbered from 1
        // independently inside each domain.
        const rows = await queryInterface.sequelize.query(
            `SELECT shortcode_id, source_domain FROM ${definitionTable} `
            + 'ORDER BY source_domain ASC, shortcode_key ASC',
            { type: Sequelize.QueryTypes.SELECT }
        );
        const nextByDomain = new Map();
        for (const row of rows) {
            const next = (nextByDomain.get(row.source_domain) || 0) + 1;
            nextByDomain.set(row.source_domain, next);
            await queryInterface.bulkUpdate(
                definitionTable,
                { sort_order: next },
                { shortcode_id: row.shortcode_id }
            );
        }

        await queryInterface.addIndex(
            definitionTable,
            ['source_domain', 'sort_order'],
            { name: 'idx_form_shortcode_domain_sort_order' }
        );
    },

    async down(queryInterface) {
        const definitionTable = table('form_shortcode_definitions');
        await queryInterface.removeIndex(definitionTable, 'idx_form_shortcode_domain_sort_order');
        await queryInterface.removeColumn(definitionTable, 'sort_order');
    },
};
