'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        // official_master_slug — stored snapshot of the role slug at time of record, next to official_master_id
        await queryInterface.addColumn(table('officials'), 'official_master_slug', {
            type:      Sequelize.STRING(100),
            allowNull: true,
            after:     'official_master_id',
        });

        // is_ref_id — flag: 1 when official_entity_id holds an official_id reference, next to official_entity_id
        await queryInterface.addColumn(table('officials'), 'is_ref_id', {
            type:         Sequelize.TINYINT(1),
            allowNull:    false,
            defaultValue: 0,
            after:        'official_entity_id',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn(table('officials'), 'official_master_slug');
        await queryInterface.removeColumn(table('officials'), 'is_ref_id');
    },

};
