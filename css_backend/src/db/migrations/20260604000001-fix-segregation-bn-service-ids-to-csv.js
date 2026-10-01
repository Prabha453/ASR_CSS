'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {
        // segregation_id (SMALLINT) → segregation_ids (VARCHAR CSV)
        await queryInterface.renameColumn(table('entity_company_details'), 'segregation_id', 'segregation_ids');
        await queryInterface.changeColumn(table('entity_company_details'), 'segregation_ids', {
            type: Sequelize.STRING(500),
            allowNull: true,
        });

        // bn_id (SMALLINT) → bn_ids (VARCHAR CSV)
        await queryInterface.renameColumn(table('entity_company_details'), 'bn_id', 'bn_ids');
        await queryInterface.changeColumn(table('entity_company_details'), 'bn_ids', {
            type: Sequelize.STRING(500),
            allowNull: true,
        });

        // service_ids (JSON) → VARCHAR CSV
        await queryInterface.changeColumn(table('entity_company_details'), 'service_ids', {
            type: Sequelize.STRING(500),
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn(table('entity_company_details'), 'service_ids', {
            type: Sequelize.JSON,
            allowNull: true,
        });

        await queryInterface.renameColumn(table('entity_company_details'), 'bn_ids', 'bn_id');
        await queryInterface.changeColumn(table('entity_company_details'), 'bn_id', {
            type: Sequelize.SMALLINT.UNSIGNED,
            allowNull: true,
        });

        await queryInterface.renameColumn(table('entity_company_details'), 'segregation_ids', 'segregation_id');
        await queryInterface.changeColumn(table('entity_company_details'), 'segregation_id', {
            type: Sequelize.SMALLINT.UNSIGNED,
            allowNull: true,
        });
    },

};
