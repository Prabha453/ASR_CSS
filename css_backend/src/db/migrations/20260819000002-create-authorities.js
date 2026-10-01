'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('authorities'), {
            authority_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: Sequelize.STRING(150),
                allowNull: false,
            },
            authority_type: {
                type: Sequelize.STRING(80),
                allowNull: true,
            },
            country_id: {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: true,
            },
            jurisdiction_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            is_deleted: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            created_date: {
                type: Sequelize.DATE,
                allowNull: true,
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

        await queryInterface.addIndex(table('authorities'), ['country_id'], { name: 'idx_auth_country_id' });
        await queryInterface.addIndex(table('authorities'), ['jurisdiction_id'], { name: 'idx_auth_jurisdiction_id' });
    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('authorities'));
    },

};
