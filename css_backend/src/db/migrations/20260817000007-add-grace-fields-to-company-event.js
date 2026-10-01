'use strict';

const table = require('../../helper/dbTable');

const TABLE_NAME = table('company_event');

module.exports = {

    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(TABLE_NAME, 'grace_end_date', {
            type: Sequelize.DATEONLY,
            allowNull: true,
        });

        await queryInterface.addColumn(TABLE_NAME, 'penalty_start_date', {
            type: Sequelize.DATEONLY,
            allowNull: true,
        });

        await queryInterface.addIndex(TABLE_NAME, ['penalty_start_date'], { name: 'idx_cse_penalty_start_date' });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex(TABLE_NAME, 'idx_cse_penalty_start_date');
        await queryInterface.removeColumn(TABLE_NAME, 'grace_end_date');
        await queryInterface.removeColumn(TABLE_NAME, 'penalty_start_date');
    },

};
