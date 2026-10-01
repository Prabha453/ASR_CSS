'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('countries'),
            {
                id: {
                    type: Sequelize.INTEGER(11),
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                iso: {
                    type: Sequelize.CHAR(2),
                    allowNull: false,
                    collate: 'utf8_unicode_ci',
                },

                acra_iso: {
                    type: Sequelize.STRING(5),
                    allowNull: false,
                    collate: 'utf8_unicode_ci',
                },

                name: {
                    type: Sequelize.STRING(80),
                    allowNull: false,
                    collate: 'utf8_unicode_ci',
                },

                country_name: {
                    type: Sequelize.STRING(80),
                    allowNull: false,
                    collate: 'utf8_unicode_ci',
                },

                nationality: {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                    defaultValue: null,
                    collate: 'utf8_unicode_ci',
                },

                iso3: {
                    type: Sequelize.CHAR(3),
                    allowNull: true,
                    defaultValue: null,
                    collate: 'utf8_unicode_ci',
                },

                currency_string: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                    defaultValue: null,
                    collate: 'utf8_unicode_ci',
                },

                currency_code: {
                    type: Sequelize.STRING(3),
                    allowNull: true,
                    defaultValue: null,
                    collate: 'utf8_unicode_ci',
                },

                numcode: {
                    type: Sequelize.SMALLINT(6),
                    allowNull: true,
                    defaultValue: null,
                },

                phonecode: {
                    type: Sequelize.INTEGER(5),
                    allowNull: false,
                },

                phone_length: {
                    type: Sequelize.STRING(55),
                    allowNull: false,
                    collate: 'utf8_unicode_ci',
                },

                region_id: {
                    type: Sequelize.INTEGER(6),
                    allowNull: false,
                },

                addr_format: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    defaultValue: null,
                    collate: 'utf8_unicode_ci',
                },

                is_delete: {
                    type: Sequelize.INTEGER(2),
                    allowNull: false,
                    defaultValue: 0,
                    comment: '1-YES, 0-NO',
                },
            },
            {
                charset: 'utf8',
                collate: 'utf8_unicode_ci',
                engine: 'InnoDB',
            }
        );

        await queryInterface.addIndex(
            table('countries'),
            ['iso'],
            {
                name: 'idx_countries_iso',
            }
        );

        await queryInterface.addIndex(
            table('countries'),
            ['iso3'],
            {
                name: 'idx_countries_iso3',
            }
        );

        await queryInterface.addIndex(
            table('countries'),
            ['currency_code'],
            {
                name: 'idx_countries_currency_code',
            }
        );

        await queryInterface.addIndex(
            table('countries'),
            ['is_delete'],
            {
                name: 'idx_countries_is_delete',
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.dropTable(
            table('countries')
        );

    },

};