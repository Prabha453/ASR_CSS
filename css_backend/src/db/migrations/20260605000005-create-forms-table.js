'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('forms'),
            {

                form_id: {
                    type: Sequelize.INTEGER.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                category_id: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                },

                form_name: {
                    type: Sequelize.STRING(250),
                    allowNull: false,
                },

                form_slug: {
                    type: Sequelize.STRING(250),
                    allowNull: false,
                    unique: true,
                },

                template_id: {
                    type: Sequelize.STRING(50),
                    allowNull: true,
                },

                save_us_id: {
                    type: Sequelize.INTEGER.UNSIGNED,
                    allowNull: false,
                    defaultValue: 0,
                },

                old_form_id: {
                    type: Sequelize.INTEGER.UNSIGNED,
                    allowNull: true,
                },

                save_us_name: {
                    type: Sequelize.STRING(50),
                    allowNull: false,
                    defaultValue: '',
                },

                download_name: {
                    type: Sequelize.STRING(250),
                    allowNull: true,
                },

                form_content: {
                    type: Sequelize.TEXT('long'),
                    allowNull: false,
                },

                popup_fields: {
                    type: Sequelize.JSON,
                    allowNull: true,
                },

                form_type: {
                    type: Sequelize.TINYINT,
                    allowNull: false,
                    defaultValue: 0,
                    comment: '0-Form Builder, 1-E-Sign, 2-Manual',
                },

                orientation: {
                    type: Sequelize.ENUM(
                        'Portrait',
                        'Landscape'
                    ),
                    allowNull: false,
                    defaultValue: 'Portrait',
                },

                margin_top: {
                    type: Sequelize.DECIMAL(5, 2),
                    allowNull: false,
                    defaultValue: 1.76,
                },

                margin_right: {
                    type: Sequelize.DECIMAL(5, 2),
                    allowNull: false,
                    defaultValue: 1.76,
                },

                margin_bottom: {
                    type: Sequelize.DECIMAL(5, 2),
                    allowNull: false,
                    defaultValue: 1.76,
                },

                margin_left: {
                    type: Sequelize.DECIMAL(5, 2),
                    allowNull: false,
                    defaultValue: 1.76,
                },

                header_margin: {
                    type: Sequelize.DECIMAL(5, 2),
                    allowNull: false,
                    defaultValue: 1.25,
                },

                footer_margin: {
                    type: Sequelize.DECIMAL(5, 2),
                    allowNull: false,
                    defaultValue: 1.25,
                },

                country_code: {
                    type: Sequelize.STRING(50),
                    allowNull: true,
                },

                default_library: {
                    type: Sequelize.STRING(50),
                    allowNull: true,
                },

                pdpa_required: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },

                assigned_user_id: {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                },

                status: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: true,
                    comment: '1-Active, 0-Inactive',
                },

                is_deleted: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },

                created_by: {
                    type: Sequelize.BIGINT.UNSIGNED,
                    allowNull: true,
                },

                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue:
                        Sequelize.literal('CURRENT_TIMESTAMP'),
                },

                updated_by: {
                    type: Sequelize.BIGINT.UNSIGNED,
                    allowNull: true,
                },

                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue:
                        Sequelize.literal('CURRENT_TIMESTAMP'),
                },

            }
        );

        await queryInterface.addIndex(
            table('forms'),
            ['form_slug'],
            {
                name: 'idx_forms_slug',
            }
        );

        await queryInterface.addIndex(
            table('forms'),
            ['category_id'],
            {
                name: 'idx_forms_category',
            }
        );

        await queryInterface.addIndex(
            table('forms'),
            ['status'],
            {
                name: 'idx_forms_status',
            }
        );

        await queryInterface.addIndex(
            table('forms'),
            ['is_deleted'],
            {
                name: 'idx_forms_deleted',
            }
        );

    },

    async down(queryInterface) {

        await queryInterface.dropTable(
            table('forms')
        );

    },

};