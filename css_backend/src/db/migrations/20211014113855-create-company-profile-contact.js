'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('company_profile_contact'),
            {

                profile_contact_id: {
                    type: Sequelize.INTEGER.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                cp_id : {
                    type: Sequelize.INTEGER.UNSIGNED,
                    allowNull: false,
                },

                email_id: {
                    type: Sequelize.STRING(200),
                    allowNull: true,
                },

                reply_id: {
                    type: Sequelize.STRING(200),
                    allowNull: true,
                },

                phone_no: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                },

                fax_no: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                },

                created_on: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue:
                        Sequelize.literal(
                            'CURRENT_TIMESTAMP'
                        ),
                },

                updated_on: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue:
                        Sequelize.literal(
                            'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
                        ),
                },

            }
        );

        await queryInterface.addIndex(
            table('company_profile_contact'),
            ['cp_id'],
            {
                name:
                    'idx_company_profile_contact_cp',
            }
        );

    },

    async down(queryInterface) {

        await queryInterface.dropTable(
            table('company_profile_contact')
        );

    },

};