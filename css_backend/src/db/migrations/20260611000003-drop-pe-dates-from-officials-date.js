'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface) {
        await queryInterface.removeColumn(table('officials_date'), 'pe_appointment_date');
        await queryInterface.removeColumn(table('officials_date'), 'pe_ceased_date');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn(table('officials_date'), 'pe_appointment_date', {
            type:      Sequelize.DATEONLY,
            allowNull: true,
            after:     'is_ceased_proposed',
        });
        await queryInterface.addColumn(table('officials_date'), 'pe_ceased_date', {
            type:      Sequelize.DATEONLY,
            allowNull: true,
            after:     'pe_appointment_date',
        });
    },

};
