'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('user_theme_settings'), {

            theme_setting_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },

            user_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                unique: true,
            },

            layout_type: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },

            layout_mode_type: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },

            left_sidebar_type: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },

            layout_width_type: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },

            layout_position_type: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },

            topbar_theme_type: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },

            leftsidbar_size_type: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },

            left_sidebar_view_type: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },

            left_sidebar_image_type: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },

            preloader: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },

            sidebar_visibility_type: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },

            created_date: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },

            updated_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },

        });

        await queryInterface.addIndex(table('user_theme_settings'), ['user_id'], {
            name: 'uq_theme_setting_user',
            unique: true,
        });

        await queryInterface.addConstraint(table('user_theme_settings'), {
            fields: ['user_id'],
            type: 'foreign key',
            name: 'fk_theme_setting_user',
            references: { table: table('users'), field: 'user_id' },
            onDelete: 'CASCADE',
        });

    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('user_theme_settings'));
    },

};
