'use strict';

const table = require('../../helper/dbTable');

const TABLE_NAME = table('company_event');

module.exports = {

    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(TABLE_NAME, 'calculation_trace_id', {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
        });

        await queryInterface.addIndex(TABLE_NAME, ['calculation_trace_id'], { name: 'idx_cse_calculation_trace_id' });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex(TABLE_NAME, 'idx_cse_calculation_trace_id');
        await queryInterface.removeColumn(TABLE_NAME, 'calculation_trace_id');
    },

};
