'use strict';

const table = require('../../helper/dbTable');

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(table('transaction_type'), 't_slug', {
            type: Sequelize.STRING(100),
            allowNull: true,
            defaultValue: null,
            after: 't_name',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn(table('transaction_type'), 't_slug');
    },
};
