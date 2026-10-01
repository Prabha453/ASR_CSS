'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('jurisdictions'), {
            jurisdiction_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            country_id: {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: false,
            },
            parent_jurisdiction_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },
            level: {
                type: Sequelize.ENUM('STATE_PROVINCE', 'FREE_ZONE', 'MUNICIPALITY'),
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(150),
                allowNull: false,
            },
            code: {
                type: Sequelize.STRING(50),
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

        await queryInterface.addIndex(table('jurisdictions'), ['country_id'], { name: 'idx_juris_country_id' });
        await queryInterface.addIndex(table('jurisdictions'), ['parent_jurisdiction_id'], { name: 'idx_juris_parent_id' });
    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('jurisdictions'));
    },

};
