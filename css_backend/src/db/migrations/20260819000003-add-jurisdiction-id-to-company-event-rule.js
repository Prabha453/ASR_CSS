'use strict';

const table = require('../../helper/dbTable');

const TABLE_NAME = table('company_event_rule');

module.exports = {

    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(TABLE_NAME, 'jurisdiction_id', {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
        });

        await queryInterface.addIndex(TABLE_NAME, ['jurisdiction_id'], { name: 'idx_csr_jurisdiction_id' });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex(TABLE_NAME, 'idx_csr_jurisdiction_id');
        await queryInterface.removeColumn(TABLE_NAME, 'jurisdiction_id');
    },

};
