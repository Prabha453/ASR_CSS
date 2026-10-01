'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(table('company_event_name'), 'grace_period_days', {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn(table('company_event_name'), 'grace_period_days');
    },

};
