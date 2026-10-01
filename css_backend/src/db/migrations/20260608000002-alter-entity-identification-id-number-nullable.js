'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn(table('entity_identification'), 'id_number', {
            type:      Sequelize.STRING(100),
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn(table('entity_identification'), 'id_number', {
            type:      Sequelize.STRING(100),
            allowNull: false,
            defaultValue: '',
        });
    },

};
