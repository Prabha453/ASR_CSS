'use strict';

const table = require('../../helper/dbTable');

const TABLE_NAME = table('company_event_name');

module.exports = {

    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(TABLE_NAME, 'operational_lead_days', {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 7,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn(TABLE_NAME, 'operational_lead_days');
    },

};
