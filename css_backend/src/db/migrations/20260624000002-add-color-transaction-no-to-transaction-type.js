// migrations/XXXXXX-add-t_type_color-transaction-no-to-transaction-type.js
'use strict';
const table = require('../../helper/dbTable');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(table('transaction_type'), 't_type_no', {
      type:         Sequelize.STRING(100),
      allowNull:    true,
      defaultValue: null,
      after:        't_order',
    });
    await queryInterface.addColumn(table('transaction_type'), 't_type_color', {
      type:         Sequelize.STRING(20),
      allowNull:    true,
      defaultValue: '#30a16c',
      after:        't_type_no',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn(table('transaction_type'), 't_type_no');
    await queryInterface.removeColumn(table('transaction_type'), 't_type_color');
  },
};