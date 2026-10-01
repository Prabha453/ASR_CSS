'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(table('official_representaive'), 'is_appt_proposed', {
            type: Sequelize.TINYINT,
            allowNull: false,
            defaultValue: 1,
            after: 'ceased_date',
        });
        await queryInterface.addColumn(table('official_representaive'), 'is_ceased_proposed', {
            type: Sequelize.TINYINT,
            allowNull: false,
            defaultValue: 1,
            after: 'is_appt_proposed',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn(table('official_representaive'), 'is_ceased_proposed');
        await queryInterface.removeColumn(table('official_representaive'), 'is_appt_proposed');
    },
};
