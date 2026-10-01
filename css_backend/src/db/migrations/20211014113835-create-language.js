'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('language'),
            {

                language_id: {
                    type: Sequelize.INTEGER.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                l_type: {
                    type: Sequelize.STRING(20),
                    allowNull: false,
                    comment: 'e.g. LABEL, MESSAGE, TOOLTIP',
                },

                l_page: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                    comment: 'Page or module identifier',
                },

                l_label: {
                    type: Sequelize.STRING(200),
                    allowNull: false,
                    comment: 'Key',
                },

                l_value: {
                    type: Sequelize.TEXT,
                    allowNull: false,
                    comment: 'Translated text',
                },

                locale: {
                    type: Sequelize.STRING(10),
                    allowNull: false,
                    defaultValue: 'en',
                    comment: 'BCP-47 locale code',
                },

                is_deleted: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },

                updated_date: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },

                updated_by: {
                    type: Sequelize.BIGINT.UNSIGNED,
                    allowNull: true,
                },

            }
        );

        /*
        |--------------------------------------------------------------------------
        | Unique Keys
        |--------------------------------------------------------------------------
        */
        await queryInterface.addConstraint(
            table('language'),
            {
                fields: ['l_page', 'l_label', 'locale'],
                type: 'unique',
                name: 'uq_language_key',
            }
        );

        /*
        |--------------------------------------------------------------------------
        | Indexes
        |--------------------------------------------------------------------------
        */
        await queryInterface.addIndex(
            table('language'),
            ['locale'],
            {
                name: 'idx_language_locale',
            }
        );

        await queryInterface.addIndex(
            table('language'),
            ['is_deleted'],
            {
                name: 'idx_language_deleted',
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.dropTable(
            table('language')
        );

    },

};