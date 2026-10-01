'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.addColumn(
            table('transaction_type'),
            't_order',
            {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                comment: 'Display order',
            }
        );

        await queryInterface.sequelize.query(`
            UPDATE ${table('transaction_type')}
            SET t_order = t_id
            WHERE t_order = 0 OR t_order IS NULL
        `);

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.removeColumn(
            table('transaction_type'),
            't_order'
        );

    },

};
