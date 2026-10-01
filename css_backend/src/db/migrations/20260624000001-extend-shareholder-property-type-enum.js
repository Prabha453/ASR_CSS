'use strict';

const table = require('../../helper/dbTable');

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn(table('officials'), 'shareholder_property_type', {
            type: Sequelize.ENUM('NOMINEE', 'NON_NOMINEE', 'TRUST', 'BENEFICIAL', 'UMBRELLA', 'NON_UMBRELLA'),
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn(table('officials'), 'shareholder_property_type', {
            type: Sequelize.ENUM('NOMINEE', 'NON_NOMINEE', 'TRUST', 'BENEFICIAL'),
            allowNull: true,
        });
    },
};
