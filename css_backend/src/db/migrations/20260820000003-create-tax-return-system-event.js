'use strict';

const table = require('../../helper/dbTable');

const EVENT_SLUG = 'tax-return';

module.exports = {
    async up(queryInterface, Sequelize) {
        const eventTable = table('company_event_name');
        const [existing] = await queryInterface.sequelize.query(
            `SELECT e_id FROM \`${eventTable}\` WHERE event_slug = :eventSlug AND is_deleted = 0 LIMIT 1`,
            {
                replacements: { eventSlug: EVENT_SLUG },
                type: Sequelize.QueryTypes.SELECT,
            }
        );

        if (existing) return;

        await queryInterface.bulkInsert(eventTable, [{
            event_type: 'EVENT',
            event_name: 'Tax Return',
            event_slug: EVENT_SLUG,
            event_subject: 'Corporate Income Tax Return Due Date',
            color_code: '#6F42C1',
            is_system_event: true,
            is_recurring: false,
            recurring_period: 0,
            recurring_duration: '',
            operational_lead_days: 30,
            grace_period_days: 0,
            category: 'TAX',
            default_frequency: 'ANNUAL',
            supports_extension: true,
            supports_waiver: true,
            evidence_required: false,
            active: true,
            is_deleted: false,
            created_date: new Date(),
            created_by: null,
            updated_date: new Date(),
            updated_by: null,
        }]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete(table('company_event_name'), {
            event_slug: EVENT_SLUG,
            is_system_event: true,
        });
    },
};
