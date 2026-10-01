'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn(table('entity_contact'), 'contact_type', {
            type:         Sequelize.ENUM('OFFICE', 'MOBILE', 'FAX', 'HOME', 'EMAIL', 'OTHER'),
            allowNull:    false,
            defaultValue: 'OFFICE',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn(table('entity_contact'), 'contact_type', {
            type:         Sequelize.ENUM('OFFICE', 'MOBILE', 'FAX', 'HOME', 'OTHER'),
            allowNull:    false,
            defaultValue: 'OFFICE',
        });
    },

};
