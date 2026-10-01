'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable(table('company_event_rule'), {
            rule_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            event_id: {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: false,
            },
            event_slug: {
                type: Sequelize.STRING(80),
                allowNull: false,
            },
            country_ids: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            legacy_country_ids: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            company_type_ids: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            rule_config: {
                type: Sequelize.JSON,
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

        await queryInterface.addIndex(table('company_event_rule'), ['event_id'], { name: 'idx_csr_event_id' });
        await queryInterface.addIndex(table('company_event_rule'), ['event_slug'], { name: 'idx_csr_event_slug' });
        await queryInterface.addIndex(table('company_event_rule'), ['is_active', 'is_deleted'], { name: 'idx_csr_active_deleted' });
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable(table('company_event_rule'));
    },
};
