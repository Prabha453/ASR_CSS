'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {
        await queryInterface.removeIndex(table('entity_company_details'), 'idx_ecd_css_status');
        await queryInterface.renameColumn(table('entity_company_details'), 'css_status_id', 'e_status_id');
        await queryInterface.addIndex(table('entity_company_details'), ['e_status_id'], { name: 'idx_ecd_e_status' });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex(table('entity_company_details'), 'idx_ecd_e_status');
        await queryInterface.renameColumn(table('entity_company_details'), 'e_status_id', 'css_status_id');
        await queryInterface.addIndex(table('entity_company_details'), ['css_status_id'], { name: 'idx_ecd_css_status' });
    },

};
