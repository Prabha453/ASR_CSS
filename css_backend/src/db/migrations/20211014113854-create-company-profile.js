'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('company_profile'),
            {
                // Primary Key
                cp_id: {
                    type: Sequelize.BIGINT.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                // -----------------------------------------------------------------
                // Company Profile
                // -----------------------------------------------------------------

                cp_company_name: {
                    type: Sequelize.STRING(300),
                    allowNull: false,
                },

                cp_registration_no: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                },

                cp_country: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                },

                cp_registered_client: {
                    type: Sequelize.TINYINT(1),
                    allowNull: false,
                    defaultValue: 0,
                    comment: '0-Registered Address, 1-Mailing Address',
                },

                cp_mailling_address: {
                    type: Sequelize.TINYINT(1),
                    allowNull: false,
                    defaultValue: 0,
                },

                cp_reg_add_block: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                },

                cp_registered_address: {
                    type: Sequelize.STRING(500),
                    allowNull: true,
                },

                cp_reg_add_building: {
                    type: Sequelize.STRING(250),
                    allowNull: true,
                },

                cp_reg_add_level: {
                    type: Sequelize.STRING(50),
                    allowNull: true,
                },

                cp_reg_add_unit: {
                    type: Sequelize.STRING(50),
                    allowNull: true,
                },

                cp_reg_add_pcode: {
                    type: Sequelize.STRING(30),
                    allowNull: true,
                },

                // -----------------------------------------------------------------
                // Profile Image
                // -----------------------------------------------------------------

                cp_profile_image: {
                    type: Sequelize.STRING(300),
                    allowNull: true,
                    comment: 'Uploaded file path',
                },

                cp_profile_image_url: {
                    type: Sequelize.STRING(500),
                    allowNull: true,
                },

                // -----------------------------------------------------------------
                // Currency & GST
                // -----------------------------------------------------------------

                cp_currency: {
                    type: Sequelize.STRING(10),
                    allowNull: false,
                    defaultValue: 'SGD',
                },

                cp_gst: {
                    type: Sequelize.DECIMAL(10, 2),
                    allowNull: false,
                    defaultValue: 0.00,
                },

                // -----------------------------------------------------------------
                // AGM / Theme
                // -----------------------------------------------------------------

                cp_default_level_held_time: {
                    type: Sequelize.TIME,
                    allowNull: true,
                },

                cp_theme_style: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                    defaultValue: 'custom',
                },

                cp_caps_proper: {
                    type: Sequelize.TINYINT(1),
                    allowNull: false,
                    defaultValue: 0,
                },

                // -----------------------------------------------------------------
                // Decimal Settings
                // -----------------------------------------------------------------

                cp_no_of_share_decimal_place: {
                    type: Sequelize.INTEGER(5),
                    allowNull: false,
                    defaultValue: 0,
                },

                cp_paid_up_share_decimal_place: {
                    type: Sequelize.INTEGER(5),
                    allowNull: false,
                    defaultValue: 0,
                },

                cp_issued_share_decimal_place: {
                    type: Sequelize.INTEGER(5),
                    allowNull: false,
                    defaultValue: 0,
                },

                // -----------------------------------------------------------------
                // Email / Contact Information
                // -----------------------------------------------------------------

                cp_email_id: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    comment: 'Multiple email ids',
                },

                cp_reply_id: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    comment: 'Multiple reply emails',
                },

                cp_contact_number: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    comment: 'Multiple contact numbers',
                },

                // -----------------------------------------------------------------
                // Email Configuration
                // -----------------------------------------------------------------

                cp_email_config: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },

                // -----------------------------------------------------------------
                // System Configuration
                // -----------------------------------------------------------------

                cp_timezone_user: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                    defaultValue: 'Asia/Singapore',
                },

                // -----------------------------------------------------------------
                // Share Certificate Settings
                // -----------------------------------------------------------------

                cp_share_certificate_payment: {
                    type: Sequelize.TINYINT(1),
                    allowNull: false,
                    defaultValue: 0,
                },

                cp_allotment_partial_payment_share_cert: {
                    type: Sequelize.TINYINT(1),
                    allowNull: false,
                    defaultValue: 0,
                },

                cp_transfer_partial_payment_share_cert: {
                    type: Sequelize.TINYINT(1),
                    allowNull: false,
                    defaultValue: 0,
                },

                cp_each_partial_payment_share_cert: {
                    type: Sequelize.TINYINT(1),
                    allowNull: false,
                    defaultValue: 0,
                },

                // -----------------------------------------------------------------
                // Transaction Number Settings
                // -----------------------------------------------------------------

                cp_share_transaction_no: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    comment: 'Stores transaction prefixes and colors',
                },

                // -----------------------------------------------------------------
                // Audit Columns
                // -----------------------------------------------------------------

                created_by: {
                    type: Sequelize.BIGINT.UNSIGNED,
                    allowNull: true,
                },

                created_date: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },

                updated_by: {
                    type: Sequelize.BIGINT.UNSIGNED,
                    allowNull: true,
                },

                updated_date: {
                    type: Sequelize.DATE,
                    allowNull: true,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
                },

                is_deleted: {
                    type: Sequelize.TINYINT(1),
                    allowNull: false,
                    defaultValue: 0,
                },

            },
            {
                charset: 'utf8mb4',
                collate: 'utf8mb4_unicode_ci',
                engine: 'InnoDB',
            }
        );

    },

    async down(queryInterface) {

        await queryInterface.dropTable(
            table('company_profile')
        );

    },

};