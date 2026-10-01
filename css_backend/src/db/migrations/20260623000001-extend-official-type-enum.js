'use strict';

const table = require('../../helper/dbTable');

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn(table('officials'), 'official_type', {
            type: Sequelize.ENUM('COMPANY', 'INDIVIDUAL', 'JOINT', 'SUB_FUND'),
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn(table('officials'), 'official_type', {
            type: Sequelize.ENUM('COMPANY', 'INDIVIDUAL'),
            allowNull: true,
        });
    },
};
