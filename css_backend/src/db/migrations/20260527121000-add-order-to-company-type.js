'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.addColumn(
            table('company_type'),
            'company_type_order',
            {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                comment: 'Display order',
            }
        );

        await queryInterface.sequelize.query(`
            UPDATE ${table('company_type')}
            SET company_type_order = company_type_id
            WHERE company_type_order = 0 OR company_type_order IS NULL
        `);

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.removeColumn(
            table('company_type'),
            'company_type_order'
        );

    },

};