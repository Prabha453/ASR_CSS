'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface) {
        await queryInterface.removeColumn(table('officials_date'), 'is_appt_effective');
        await queryInterface.removeColumn(table('officials_date'), 'is_ceased_effective');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn(table('officials_date'), 'is_appt_effective', {
            type: Sequelize.TINYINT,
            allowNull: false,
            defaultValue: 0,
            after: 'is_appt_proposed',
        });
        await queryInterface.addColumn(table('officials_date'), 'is_ceased_effective', {
            type: Sequelize.TINYINT,
            allowNull: false,
            defaultValue: 0,
            after: 'is_ceased_proposed',
        });
    },
};
