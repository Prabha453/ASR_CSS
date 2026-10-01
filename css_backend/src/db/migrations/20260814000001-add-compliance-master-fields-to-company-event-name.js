'use strict';

const table = require('../../helper/dbTable');

const TABLE_NAME = table('company_event_name');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.addColumn(TABLE_NAME, 'category', {
            type: Sequelize.STRING(50),
            allowNull: true,
        });

        await queryInterface.addColumn(TABLE_NAME, 'authority_type', {
            type: Sequelize.STRING(80),
            allowNull: true,
        });

        await queryInterface.addColumn(TABLE_NAME, 'default_frequency', {
            type: Sequelize.ENUM('ONE_TIME', 'ANNUAL', 'SEMI_ANNUAL', 'QUARTERLY', 'MONTHLY', 'AD_HOC'),
            allowNull: true,
        });

        await queryInterface.addColumn(TABLE_NAME, 'supports_extension', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });

        await queryInterface.addColumn(TABLE_NAME, 'supports_waiver', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });

        await queryInterface.addColumn(TABLE_NAME, 'evidence_required', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });

        await queryInterface.addColumn(TABLE_NAME, 'active', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        });

        await queryInterface.addColumn(TABLE_NAME, 'created_date', {
            type: Sequelize.DATE,
            allowNull: true,
        });

        await queryInterface.addColumn(TABLE_NAME, 'created_by', {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
        });

        await queryInterface.addIndex(TABLE_NAME, ['category'], { name: 'idx_event_name_category' });

        await queryInterface.sequelize.query(
            `UPDATE \`${TABLE_NAME}\` SET \`active\` = NOT \`is_deleted\`, \`created_date\` = COALESCE(\`updated_date\`, NOW())`
        );
    },

    async down(queryInterface) {
        await queryInterface.removeIndex(TABLE_NAME, 'idx_event_name_category');
        await queryInterface.removeColumn(TABLE_NAME, 'category');
        await queryInterface.removeColumn(TABLE_NAME, 'authority_type');
        await queryInterface.removeColumn(TABLE_NAME, 'default_frequency');
        await queryInterface.removeColumn(TABLE_NAME, 'supports_extension');
        await queryInterface.removeColumn(TABLE_NAME, 'supports_waiver');
        await queryInterface.removeColumn(TABLE_NAME, 'evidence_required');
        await queryInterface.removeColumn(TABLE_NAME, 'active');
        await queryInterface.removeColumn(TABLE_NAME, 'created_date');
        await queryInterface.removeColumn(TABLE_NAME, 'created_by');
    },

};
