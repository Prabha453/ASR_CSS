'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('entity_contact'), {

            contact_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },

            entity_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
            },

            entity_type: {
                type: Sequelize.ENUM('COMPANY', 'INDIVIDUAL'),
                allowNull: false,
            },

            contact_type: {
                type: Sequelize.ENUM('OFFICE', 'MOBILE', 'FAX', 'HOME', 'OTHER'),
                allowNull: false,
                defaultValue: 'OFFICE',
            },

            phone_country_code: {
                type: Sequelize.STRING(10),
                allowNull: true,
                defaultValue: '+65',
            },

            phone_number: {
                type: Sequelize.STRING(30),
                allowNull: true,
            },

            email: {
                type: Sequelize.STRING(200),
                allowNull: true,
            },

            website: {
                type: Sequelize.STRING(500),
                allowNull: true,
                comment: 'Company use',
            },

            fax: {
                type: Sequelize.STRING(30),
                allowNull: true,
            },

            is_primary: {
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
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },

            created_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },

            updated_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },

            updated_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },

        });

        await queryInterface.addIndex(table('entity_contact'), ['entity_id'],   { name: 'idx_contact_entity' });
        await queryInterface.addIndex(table('entity_contact'), ['contact_type'],{ name: 'idx_contact_type' });
        await queryInterface.addIndex(table('entity_contact'), ['email'],       { name: 'idx_contact_email' });
        await queryInterface.addIndex(table('entity_contact'), ['phone_number'],{ name: 'idx_contact_phone' });
        await queryInterface.addIndex(table('entity_contact'), ['is_deleted'],  { name: 'idx_contact_deleted' });

        await queryInterface.addConstraint(table('entity_contact'), {
            fields: ['entity_id'],
            type: 'foreign key',
            name: 'fk_contact_entity',
            references: { table: table('entities'), field: 'entity_id' },
            onDelete: 'CASCADE',
        });

    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('entity_contact'));
    },

};
