'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn(
            table('company_profile'),
            'cp_authorized_captial_countries',
            {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: null,
                after: 'cp_each_partial_payment_share_cert',
            }
        );
    },

    down: async (queryInterface) => {
        await queryInterface.removeColumn(
            table('company_profile'),
            'cp_authorized_captial_countries'
        );
    },

};
