'use strict';

const table = require('../../helper/dbTable');

module.exports = {
    up: async queryInterface => queryInterface.removeColumn(table('forms'), 'is_publish'),
    down: async (queryInterface, Sequelize) => queryInterface.addColumn(table('forms'), 'is_publish', {
        type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true,
    }),
};
