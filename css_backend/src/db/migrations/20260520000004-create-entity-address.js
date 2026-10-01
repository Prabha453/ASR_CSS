'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('entity_address'), {

            address_id: {
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

            address_type: {
                type: Sequelize.ENUM('CONTACT', 'RESIDENTIAL', 'FOREIGN', 'REGISTERED', 'BUSINESS', 'MAILING', 'OTHER'),
                allowNull: false,
                defaultValue: 'CONTACT',
            },

            block_no: {
                type: Sequelize.STRING(20),
                allowNull: true,
                comment: 'House No./Block',
            },

            street_name: {
                type: Sequelize.STRING(200),
                allowNull: true,
            },

            building_name: {
                type: Sequelize.STRING(200),
                allowNull: true,
                comment: 'Building/Estate',
            },

            level_no: {
                type: Sequelize.STRING(20),
                allowNull: true,
                comment: 'Level',
            },

            unit_no: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },

            city: {
                type: Sequelize.STRING(100),
                allowNull: true,
                comment: 'City and/or Town',
            },

            state: {
                type: Sequelize.STRING(100),
                allowNull: true,
                comment: 'State/Province',
            },

            postal_code: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },

            country: {
                type: Sequelize.STRING(100),
                allowNull: false,
                defaultValue: 'Singapore',
            },

            country_code: {
                type: Sequelize.CHAR(3),
                allowNull: true,
            },

            region_id: {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: true,
            },

            proof_of_address_url: {
                type: Sequelize.STRING(500),
                allowNull: true,
                comment: 'Uploaded proof document',
            },

            proof_of_address_name: {
                type: Sequelize.STRING(200),
                allowNull: true,
            },

            is_primary: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },

            effective_from: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },

            effective_to: {
                type: Sequelize.DATEONLY,
                allowNull: true,
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

        await queryInterface.addIndex(table('entity_address'), ['entity_id'],   { name: 'idx_address_entity' });
        await queryInterface.addIndex(table('entity_address'), ['address_type'],{ name: 'idx_address_type' });
        await queryInterface.addIndex(table('entity_address'), ['postal_code'], { name: 'idx_address_postal' });
        await queryInterface.addIndex(table('entity_address'), ['country_code'],{ name: 'idx_address_country' });
        await queryInterface.addIndex(table('entity_address'), ['region_id'],   { name: 'idx_address_region' });
        await queryInterface.addIndex(table('entity_address'), ['is_deleted'],  { name: 'idx_address_deleted' });

        await queryInterface.addConstraint(table('entity_address'), {
            fields: ['entity_id'],
            type: 'foreign key',
            name: 'fk_address_entity',
            references: { table: table('entities'), field: 'entity_id' },
            onDelete: 'CASCADE',
        });

        await queryInterface.addConstraint(table('entity_address'), {
            fields: ['region_id'],
            type: 'foreign key',
            name: 'fk_address_region',
            references: { table: table('region_master'), field: 'region_id' },
            onDelete: 'SET NULL',
        });

    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('entity_address'));
    },

};
