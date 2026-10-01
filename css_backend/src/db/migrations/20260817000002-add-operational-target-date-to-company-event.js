'use strict';

const table = require('../../helper/dbTable');

const TABLE_NAME = table('company_event');

module.exports = {

    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(TABLE_NAME, 'operational_target_date', {
            type: Sequelize.DATEONLY,
            allowNull: true,
        });

        await queryInterface.addIndex(TABLE_NAME, ['operational_target_date'], { name: 'idx_cse_operational_target_date' });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex(TABLE_NAME, 'idx_cse_operational_target_date');
        await queryInterface.removeColumn(TABLE_NAME, 'operational_target_date');
    },

};
