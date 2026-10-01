'use strict';

const table = require('../../helper/dbTable');

const TABLE_NAME = table('company_event_rule');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.addColumn(TABLE_NAME, 'rule_code', {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
        });

        await queryInterface.addColumn(TABLE_NAME, 'version_no', {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 1,
        });

        await queryInterface.addColumn(TABLE_NAME, 'version_status', {
            type: Sequelize.ENUM('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'SUPERSEDED', 'RETIRED'),
            allowNull: false,
            defaultValue: 'DRAFT',
        });

        await queryInterface.addColumn(TABLE_NAME, 'effective_from', {
            type: Sequelize.DATEONLY,
            allowNull: true,
        });

        await queryInterface.addColumn(TABLE_NAME, 'effective_to', {
            type: Sequelize.DATEONLY,
            allowNull: true,
        });

        await queryInterface.addColumn(TABLE_NAME, 'rule_priority', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        });

        await queryInterface.addColumn(TABLE_NAME, 'submitted_by', {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
        });

        await queryInterface.addColumn(TABLE_NAME, 'submitted_date', {
            type: Sequelize.DATE,
            allowNull: true,
        });

        await queryInterface.addColumn(TABLE_NAME, 'approved_by', {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
        });

        await queryInterface.addColumn(TABLE_NAME, 'approved_date', {
            type: Sequelize.DATE,
            allowNull: true,
        });

        await queryInterface.addColumn(TABLE_NAME, 'published_by', {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
        });

        await queryInterface.addColumn(TABLE_NAME, 'published_date', {
            type: Sequelize.DATE,
            allowNull: true,
        });

        await queryInterface.addColumn(TABLE_NAME, 'retired_by', {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
        });

        await queryInterface.addColumn(TABLE_NAME, 'retired_date', {
            type: Sequelize.DATE,
            allowNull: true,
        });

        await queryInterface.addColumn(TABLE_NAME, 'superseded_by_rule_id', {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
        });

        await queryInterface.addIndex(TABLE_NAME, ['rule_code'], { name: 'idx_csr_rule_code' });
        await queryInterface.addIndex(TABLE_NAME, ['version_status'], { name: 'idx_csr_version_status' });
        await queryInterface.addIndex(TABLE_NAME, ['effective_from', 'effective_to'], { name: 'idx_csr_effective' });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex(TABLE_NAME, 'idx_csr_rule_code');
        await queryInterface.removeIndex(TABLE_NAME, 'idx_csr_version_status');
        await queryInterface.removeIndex(TABLE_NAME, 'idx_csr_effective');

        await queryInterface.removeColumn(TABLE_NAME, 'rule_code');
        await queryInterface.removeColumn(TABLE_NAME, 'version_no');
        await queryInterface.removeColumn(TABLE_NAME, 'version_status');
        await queryInterface.removeColumn(TABLE_NAME, 'effective_from');
        await queryInterface.removeColumn(TABLE_NAME, 'effective_to');
        await queryInterface.removeColumn(TABLE_NAME, 'rule_priority');
        await queryInterface.removeColumn(TABLE_NAME, 'submitted_by');
        await queryInterface.removeColumn(TABLE_NAME, 'submitted_date');
        await queryInterface.removeColumn(TABLE_NAME, 'approved_by');
        await queryInterface.removeColumn(TABLE_NAME, 'approved_date');
        await queryInterface.removeColumn(TABLE_NAME, 'published_by');
        await queryInterface.removeColumn(TABLE_NAME, 'published_date');
        await queryInterface.removeColumn(TABLE_NAME, 'retired_by');
        await queryInterface.removeColumn(TABLE_NAME, 'retired_date');
        await queryInterface.removeColumn(TABLE_NAME, 'superseded_by_rule_id');
    },

};
