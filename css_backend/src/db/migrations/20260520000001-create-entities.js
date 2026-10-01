'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('entities'), {

            entity_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },

            entity_type: {
                type: Sequelize.ENUM('COMPANY', 'INDIVIDUAL'),
                allowNull: false,
            },

            name: {
                type: Sequelize.STRING(300),
                allowNull: false,
            },

            client_no: {
                type: Sequelize.STRING(50),
                allowNull: true,
                comment: 'Internal client reference',
            },

            status: {
                type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'PENDING'),
                allowNull: false,
                defaultValue: 'ACTIVE',
            },

            // Company-only fields
            company_reg_type: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },

            uen_no: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },

            fbrn_reg_no: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },

            domes_bus_no: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },

            acra_no: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },

            company_type_id: {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: true,
            },

            company_status: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },

            // Default pointers — FKs added in migration 20260520000008
            default_address_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },

            default_contact_id: {
                type: Sequelize.BIGINT.UNSIGNED,
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

        await queryInterface.addIndex(table('entities'), ['entity_type'],   { name: 'idx_entity_type' });
        await queryInterface.addIndex(table('entities'), ['name'],          { name: 'idx_entity_name' });
        await queryInterface.addIndex(table('entities'), ['client_no'],     { name: 'idx_entity_client_no' });
        await queryInterface.addIndex(table('entities'), ['company_type_id'], { name: 'idx_entity_company_type' });
        await queryInterface.addIndex(table('entities'), ['status'],        { name: 'idx_entity_status' });
        await queryInterface.addIndex(table('entities'), ['is_deleted'],    { name: 'idx_entity_deleted' });
        await queryInterface.addIndex(table('entities'), ['uen_no'],        { name: 'uq_entity_uen', unique: true });

        await queryInterface.addConstraint(table('entities'), {
            fields: ['company_type_id'],
            type: 'foreign key',
            name: 'fk_entity_company_type',
            references: { table: table('company_type'), field: 'company_type_id' },
            onDelete: 'SET NULL',
        });

    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('entities'));
    },

};
