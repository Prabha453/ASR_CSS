'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        // 1. Clean up company ID types wrongly added to member_id_type in a previous run
        await queryInterface.bulkDelete(
            table('member_id_type'),
            { m_identification_id: [10, 11, 12, 13, 14] },
            {}
        );

        // 2. Make id_number nullable (company rows don't use this column)
        await queryInterface.changeColumn(table('entity_identification'), 'id_number', {
            type: Sequelize.STRING(100),
            allowNull: true,
        });

        // 3. Add 5 company identification columns to entity_identification
        //    (columns in cs_entities were already removed in a previous run)
        await queryInterface.addColumn(table('entity_identification'), 'uen_no',       { type: Sequelize.STRING(50), allowNull: true, after: 'id_number' });
        await queryInterface.addColumn(table('entity_identification'), 'fbrn_reg_no',  { type: Sequelize.STRING(50), allowNull: true, after: 'uen_no'    });
        await queryInterface.addColumn(table('entity_identification'), 'uf_no',        { type: Sequelize.STRING(50), allowNull: true, after: 'fbrn_reg_no' });
        await queryInterface.addColumn(table('entity_identification'), 'domes_bus_no', { type: Sequelize.STRING(50), allowNull: true, after: 'uf_no'      });
        await queryInterface.addColumn(table('entity_identification'), 'acra_no',      { type: Sequelize.STRING(50), allowNull: true, after: 'domes_bus_no' });
    },

    async down(queryInterface, Sequelize) {

        // Remove 5 columns from entity_identification
        await queryInterface.removeColumn(table('entity_identification'), 'uen_no');
        await queryInterface.removeColumn(table('entity_identification'), 'fbrn_reg_no');
        await queryInterface.removeColumn(table('entity_identification'), 'uf_no');
        await queryInterface.removeColumn(table('entity_identification'), 'domes_bus_no');
        await queryInterface.removeColumn(table('entity_identification'), 'acra_no');
    },

};
