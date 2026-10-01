'use strict';

const table = require('../../helper/dbTable');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const tableName = table('company_event_name');
        const columns = await queryInterface.describeTable(tableName);

        if (!columns.event_slug) {
            await queryInterface.addColumn(tableName, 'event_slug', {
                type: Sequelize.STRING(100),
                allowNull: true,
                after: 'event_name',
            });
        }

        if (!columns.is_system_event) {
            await queryInterface.addColumn(tableName, 'is_system_event', {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                after: 'color_code',
            });
        }

        if (!columns.is_recurring) {
            await queryInterface.addColumn(tableName, 'is_recurring', {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                after: 'is_system_event',
            });
        }

        if (columns.event_type && columns.event_type.type && !String(columns.event_type.type).toUpperCase().includes('CHAR')) {
            await queryInterface.sequelize.query(`
                ALTER TABLE ${tableName}
                MODIFY event_type VARCHAR(20) NOT NULL DEFAULT 'EVENT'
            `);
        }

        await queryInterface.sequelize.query(`
            UPDATE ${tableName}
            SET event_type = CASE
                WHEN event_type IN ('0', '2', 'LOG', 'Log', 'log') THEN 'LOG'
                ELSE 'EVENT'
            END
        `);

        if (!columns.recurring_period) {
            await queryInterface.addColumn(tableName, 'recurring_period', {
                  type: Sequelize.INTEGER.UNSIGNED,
                  allowNull: false,
                  defaultValue: 0,
                after: 'event_slug',
            });
        }

        if (!columns.recurring_duration) {
            await queryInterface.addColumn(tableName, 'recurring_duration', {
                type: Sequelize.STRING(50),
                allowNull: true,
                after: 'recurring_period',
            });
        }

        await queryInterface.sequelize.query(`
            UPDATE ${tableName}
            SET is_recurring = CASE
                WHEN COALESCE(recurring_period, 0) > 0 THEN 1
                ELSE COALESCE(is_recurring, 0)
            END
        `);

        await queryInterface.sequelize.query(`
            UPDATE ${tableName}
            SET event_slug = CASE
                WHEN event_name = 'Annual General Meeting' THEN 'annual-general-meeting'
                WHEN event_name = 'Annual Return Filing' THEN 'annual-return-filing'
                WHEN event_name = 'Board Resolution' THEN 'board-resolution'
                WHEN event_name = 'Tax Filing' THEN 'tax-filing'
                WHEN event_name = 'Service Review' THEN 'service-review'
                WHEN event_name = 'ECI' THEN 'eci'
                WHEN event_name = 'Anniversary' THEN 'anniversary'
                WHEN event_name = 'Anniversary of Registration' THEN 'anniversary-of-registration'
                WHEN event_name = 'Annual Filing' THEN 'annual-filing'
                WHEN event_name = 'Annual Declaration' THEN 'annual-declaration'
                WHEN event_name = 'Tax Return' THEN 'tax-return'
                WHEN event_name = 'Quotation Submission' THEN 'quotation-submission'
                ELSE LOWER(REPLACE(TRIM(event_name), ' ', '-'))
            END
            WHERE event_slug IS NULL OR event_slug = ''
        `);

        await queryInterface.sequelize.query(`
            UPDATE ${tableName}
            SET is_system_event = CASE
                WHEN event_name IN ('ECI', 'AR', 'Anniversary', 'AGM') THEN 1
                ELSE COALESCE(is_system_event, 0)
            END
        `);

        const indexes = await queryInterface.showIndex(tableName);
        const hasSlugIndex = indexes.some(index => index.name === 'idx_event_name_slug');
        if (!hasSlugIndex) {
            await queryInterface.addIndex(tableName, ['event_slug'], {
                name: 'idx_event_name_slug',
            });
        }
    },

    down: async (queryInterface) => {
        const tableName = table('company_event_name');
        const indexes = await queryInterface.showIndex(tableName);
        const columns = await queryInterface.describeTable(tableName);
        const hasBaseColumns = columns.event_slug && columns.recurring_period && columns.recurring_duration;
        const hasSlugIndex = indexes.some(index => index.name === 'idx_event_name_slug');

        if (hasSlugIndex && !hasBaseColumns) {
            await queryInterface.removeIndex(tableName, 'idx_event_name_slug');
        }
    },
};
