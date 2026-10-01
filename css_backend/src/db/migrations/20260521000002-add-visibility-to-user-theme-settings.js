'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(table('user_theme_settings'), 'breadcrumbs_visibility', {
            type: Sequelize.STRING(10),
            allowNull: true,
            defaultValue: 'show',
            after: 'sidebar_visibility_type',
        });

        await queryInterface.addColumn(table('user_theme_settings'), 'footer_visibility', {
            type: Sequelize.STRING(10),
            allowNull: true,
            defaultValue: 'show',
            after: 'breadcrumbs_visibility',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn(table('user_theme_settings'), 'breadcrumbs_visibility');
        await queryInterface.removeColumn(table('user_theme_settings'), 'footer_visibility');
    },

};
