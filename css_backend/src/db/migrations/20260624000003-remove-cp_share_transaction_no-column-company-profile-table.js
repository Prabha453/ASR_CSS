'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.removeColumn(
            table('company_profile'),
            'cp_share_transaction_no'
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.addColumn(
            table('company_profile'),
            'cp_share_transaction_no',
            {
                type:      Sequelize.TEXT,
                allowNull: true,
                comment:   'Stores transaction prefixes and colors',
            }
        );

    },

};