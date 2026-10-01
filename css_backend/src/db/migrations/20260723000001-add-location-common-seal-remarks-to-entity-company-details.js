'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(table('entity_company_details'), 'location_common_seal_remarks', {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Remarks on where the company common seal is kept',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn(table('entity_company_details'), 'location_common_seal_remarks');
    },

};
