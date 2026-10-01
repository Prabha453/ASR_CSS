'use strict';

const table = require('../../helper/dbTable');

const TABLE_NAME = table('company_event_name');

module.exports = {

    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(TABLE_NAME, 'authority_id', {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
        });

        await queryInterface.addIndex(TABLE_NAME, ['authority_id'], { name: 'idx_cen_authority_id' });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex(TABLE_NAME, 'idx_cen_authority_id');
        await queryInterface.removeColumn(TABLE_NAME, 'authority_id');
    },

};
