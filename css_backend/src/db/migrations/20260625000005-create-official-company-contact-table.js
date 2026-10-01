'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        await queryInterface.createTable(table('official_company_contact'), {

            contact_id: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },

            entity_id: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false,
            },

            official_entity_id: {
                type: Sequelize.STRING(255),
                allowNull: false,
                comment: 'Official Entity ID (legacy stored as text)',
            },

            email: {
                type: Sequelize.TEXT,
                allowNull: false,
                defaultValue: '',
            },

            mobile: {
                type: Sequelize.STRING(30),
                allowNull: false,
                defaultValue: '',
            },

            mobile_code: {
                type: Sequelize.STRING(30),
                allowNull: false,
                defaultValue: '',
            },

            telephone: {
                type: Sequelize.STRING(30),
                allowNull: false,
                defaultValue: '',
            },

            telephone_code: {
                type: Sequelize.STRING(30),
                allowNull: false,
                defaultValue: '',
            },

            office: {
                type: Sequelize.STRING(30),
                allowNull: false,
                defaultValue: '',
            },

            office_code: {
                type: Sequelize.STRING(30),
                allowNull: false,
                defaultValue: '',
            },

            ext_no: {
                type: Sequelize.STRING(30),
                allowNull: false,
                defaultValue: '',
            },

            deleted: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },

            created_by: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: true,
                defaultValue: null,
            },

            created_date: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },

        });

        await queryInterface.addIndex(
            table('official_company_contact'),
            ['entity_id'],
            {
                name: 'idx_official_company_contact_entity_id',
            }
        );

        await queryInterface.addIndex(
            table('official_company_contact'),
            ['official_entity_id'],
            {
                name: 'idx_official_company_contact_official_entity_id',
            }
        );

        await queryInterface.addIndex(
            table('official_company_contact'),
            ['deleted'],
            {
                name: 'idx_official_company_contact_deleted',
            }
        );

    },

    down: async (queryInterface) => {

        await queryInterface.dropTable(table('official_company_contact'));

    },

};