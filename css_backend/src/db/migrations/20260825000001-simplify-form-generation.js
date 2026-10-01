'use strict';

const table = require('../../helper/dbTable');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn(table('forms'), 'is_publish', {
            type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false,
        });
        await queryInterface.dropTable(table('form_generation_artifacts'));
        await queryInterface.dropTable(table('form_generation_runs'));
        await queryInterface.dropTable(table('form_template_version_fields'));
        await queryInterface.dropTable(table('form_template_versions'));
    },
    down: async () => {
        throw new Error('This destructive simplification migration cannot be reversed automatically');
    },
};
