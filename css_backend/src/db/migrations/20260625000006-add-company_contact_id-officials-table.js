'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.addColumn(
            table('officials'),
            'company_contact_id',
            {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: true,
                defaultValue: null,
                after: 'shareholder_property_type',
            }
        );

        await queryInterface.addIndex(
            table('officials'),
            ['company_contact_id'],
            {
                name: 'idx_officials_company_contact_id',
            }
        );

    },

    async down(queryInterface) {

        await queryInterface.removeIndex(
            table('officials'),
            'idx_officials_company_contact_id'
        );

        await queryInterface.removeColumn(
            table('officials'),
            'company_contact_id'
        );

    },

};