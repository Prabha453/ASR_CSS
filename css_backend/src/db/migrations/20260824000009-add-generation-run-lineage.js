'use strict';

const table = require('../../helper/dbTable');

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(table('form_generation_runs'), 'source_generation_run_id', {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
            references: { model: table('form_generation_runs'), key: 'generation_run_id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        });
        await queryInterface.addIndex(table('form_generation_runs'), ['source_generation_run_id'], {
            name: 'idx_form_generation_runs_source',
        });
    },
    async down(queryInterface) {
        await queryInterface.removeIndex(table('form_generation_runs'), 'idx_form_generation_runs_source');
        await queryInterface.removeColumn(table('form_generation_runs'), 'source_generation_run_id');
    },
};
