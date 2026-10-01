'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        // Add missing company-level fields to entities
        await queryInterface.addColumn(table('entities'), 'former_name', {
            type: Sequelize.STRING(300),
            allowNull: true,
            after: 'name',
        });

        await queryInterface.addColumn(table('entities'), 'uf_no', {
            type: Sequelize.STRING(50),
            allowNull: true,
            after: 'fbrn_reg_no',
        });

        await queryInterface.addColumn(table('entities'), 'remarks', {
            type: Sequelize.TEXT,
            allowNull: true,
            after: 'company_status',
        });

        await queryInterface.addColumn(table('entities'), 'additional_remarks', {
            type: Sequelize.TEXT,
            allowNull: true,
            after: 'remarks',
        });

        // Add REGISTER_OF_MEMBERS to entity_address address_type enum
        await queryInterface.sequelize.query(
            `ALTER TABLE ${table('entity_address')}
             MODIFY COLUMN address_type
             ENUM('CONTACT','RESIDENTIAL','FOREIGN','REGISTERED','BUSINESS','MAILING','OTHER','REGISTER_OF_MEMBERS')
             NOT NULL DEFAULT 'CONTACT'`
        );

    },

    async down(queryInterface) {
        await queryInterface.removeColumn(table('entities'), 'former_name');
        await queryInterface.removeColumn(table('entities'), 'uf_no');
        await queryInterface.removeColumn(table('entities'), 'remarks');
        await queryInterface.removeColumn(table('entities'), 'additional_remarks');

        await queryInterface.sequelize.query(
            `ALTER TABLE ${table('entity_address')}
             MODIFY COLUMN address_type
             ENUM('CONTACT','RESIDENTIAL','FOREIGN','REGISTERED','BUSINESS','MAILING','OTHER')
             NOT NULL DEFAULT 'CONTACT'`
        );
    },

};
