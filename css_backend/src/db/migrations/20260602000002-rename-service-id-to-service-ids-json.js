'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {
        await queryInterface.renameColumn(table('entity_company_details'), 'service_id', 'service_ids');
        await queryInterface.changeColumn(table('entity_company_details'), 'service_ids', {
            type: Sequelize.JSON,
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn(table('entity_company_details'), 'service_ids', {
            type: Sequelize.SMALLINT.UNSIGNED,
            allowNull: true,
        });
        await queryInterface.renameColumn(table('entity_company_details'), 'service_ids', 'service_id');
    },

};
