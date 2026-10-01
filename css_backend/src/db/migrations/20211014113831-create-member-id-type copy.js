'use strict';

const table = require('../../helper/dbTable');

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(table('member_id_type'), {

            m_identification_id: {
                type: Sequelize.SMALLINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },

            id_name: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },

            slug_name: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true,
            },

            country_code: {
                type: Sequelize.CHAR(3),
                allowNull: true,
                comment: 'ISO 3166-1 alpha-3; NULL = universal',
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

        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable(table('member_id_type'));
    },
};