'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('corp_sec_type'),
            {

                corp_sec_id: {
                    type: Sequelize.SMALLINT.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                corp_sec_parent: {
                    type: Sequelize.SMALLINT.UNSIGNED,
                    allowNull: true,
                },

                corp_sec_name: {
                    type: Sequelize.STRING(150),
                    allowNull: false,
                },

                files: {
                    type: Sequelize.STRING(500),
                    allowNull: true,
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

        await queryInterface.addIndex(
            table('corp_sec_type'),
            ['corp_sec_parent'],
            {
                name: 'idx_corp_sec_parent',
            }
        );

        await queryInterface.addIndex(
            table('corp_sec_type'),
            ['is_deleted'],
            {
                name: 'idx_corp_sec_deleted',
            }
        );

        await queryInterface.addConstraint(
            table('corp_sec_type'),
            {
                fields: ['corp_sec_parent'],
                type: 'foreign key',
                name: 'fk_corp_sec_parent',
                references: {
                    table: table('corp_sec_type'),
                    field: 'corp_sec_id',
                },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.dropTable(
            table('corp_sec_type')
        );

    },

};