'use strict';
const table = require('../../helper/dbTable');

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(table('officials'), 'identification_id', {
            type:      Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
            after:     'official_type',
        });
    },
    async down(queryInterface) {
        await queryInterface.removeColumn(table('officials'), 'identification_id');
    },
};
