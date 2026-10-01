'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(table('user_theme_settings'), 'default_page_size', {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: 10,
            after: 'footer_visibility',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn(table('user_theme_settings'), 'default_page_size');
    },

};
