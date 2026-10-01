'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.removeConstraint(table('entity_company_details'), 'fk_ecd_group');
        await queryInterface.removeColumn(table('entity_company_details'), 'group_id');

        await queryInterface.addColumn(table('entity_company_details'), 'group_ids', {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: 'CSV of group_master.group_id values',
        });
    },

    async down(queryInterface, Sequelize) {

        await queryInterface.removeColumn(table('entity_company_details'), 'group_ids');

        await queryInterface.addColumn(table('entity_company_details'), 'group_id', {
            type: Sequelize.SMALLINT.UNSIGNED,
            allowNull: true,
        });

        await queryInterface.addConstraint(table('entity_company_details'), {
            fields: ['group_id'],
            type: 'foreign key',
            name: 'fk_ecd_group',
            references: { table: table('group_master'), field: 'group_id' },
            onDelete: 'SET NULL',
        });
    },

};
