'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('email_configuration'),
            {

                email_config_id: {
                    type: Sequelize.INTEGER.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                config_name: {
                    type: Sequelize.STRING(150),
                    allowNull: true,
                },

                smtp_host: {
                    type: Sequelize.STRING(200),
                    allowNull: true,
                },

                smtp_port: {
                    type: Sequelize.SMALLINT.UNSIGNED,
                    allowNull: true,
                    defaultValue: 587,
                },

                smtp_user: {
                    type: Sequelize.STRING(200),
                    allowNull: true,
                },

                smtp_password: {
                    type: Sequelize.STRING(500),
                    allowNull: true,
                    comment: 'Encrypted',
                },

                smtp_encryption: {
                    type: Sequelize.ENUM(
                        'NONE',
                        'TLS',
                        'SSL'
                    ),
                    allowNull: false,
                    defaultValue: 'TLS',
                },

                sending_email: {
                    type: Sequelize.STRING(200),
                    allowNull: false,
                },

                reply_email: {
                    type: Sequelize.STRING(200),
                    allowNull: false,
                },

                from_name: {
                    type: Sequelize.STRING(200),
                    allowNull: true,
                },

                aws_ses: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: '1 - Verified',
                },

                group_to_recipient: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },

                is_default: {
                    type: Sequelize.TINYINT(1),
                    allowNull: false,
                    defaultValue: 0,
                },

                is_deleted: {
                    type: Sequelize.TINYINT(1),
                    allowNull: false,
                    defaultValue: 0,
                },

                created_date: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue:
                        Sequelize.literal(
                            'CURRENT_TIMESTAMP'
                        ),
                },

                created_by: {
                    type: Sequelize.BIGINT.UNSIGNED,
                    allowNull: true,
                },

                updated_date: {
                    type: Sequelize.DATE,
                    allowNull: true,
                    defaultValue:
                        Sequelize.literal(
                            'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
                        ),
                },

                updated_by: {
                    type: Sequelize.BIGINT.UNSIGNED,
                    allowNull: true,
                },

            }
        );

        await queryInterface.addIndex(
            table('email_configuration'),
            ['is_default'],
            {
                name: 'idx_email_config_default',
            }
        );

        await queryInterface.addIndex(
            table('email_configuration'),
            ['is_deleted'],
            {
                name: 'idx_email_config_deleted',
            }
        );

    },

    async down(queryInterface) {

        await queryInterface.dropTable(
            table('email_configuration')
        );

    },

};