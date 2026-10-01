'use strict';

const table = require('../../helper/dbTable');

const events = [
    { e_id: 1, event_name: 'ECI', event_slug: 'eci', event_subject: 'Estimated Chargeable Income', color_code: '#DC3545', is_system_event: true },
    { e_id: 2, event_name: 'AR', event_slug: 'ar', event_subject: 'Annual Return Due Date', color_code: '#20C997', is_system_event: true },
    { e_id: 3, event_name: 'Anniversary', event_slug: 'anniversary', event_subject: 'Company Anniversary', color_code: '#6610F2', is_system_event: true },
    { e_id: 4, event_name: 'AGM', event_slug: 'agm', event_subject: 'AGM Notice and Agenda', color_code: '#0D6EFD', is_system_event: true },
    { e_id: 5, event_name: 'Annual General Meeting', event_slug: 'annual-general-meeting', event_subject: 'AGM Notice and Agenda', color_code: '#0D6EFD' },
    { e_id: 6, event_name: 'Annual Return Filing', event_slug: 'annual-return-filing', event_subject: 'Annual Return Due Date', color_code: '#20C997' },
    { e_id: 7, event_name: 'Board Resolution', event_slug: 'board-resolution', event_subject: 'Board Resolution Draft and Approval', color_code: '#FD7E14' },
    { e_id: 8, event_name: 'Tax Filing', event_slug: 'tax-filing', event_subject: 'Corporate Tax Submission', color_code: '#6F42C1' },
    { e_id: 9, event_name: 'Service Review', event_slug: 'service-review', event_subject: 'Quarterly Service Performance Review', color_code: '#198754' },
];

module.exports = {
    up: async (queryInterface) => {
        await queryInterface.bulkDelete(table('company_event_name'), {}, {});

        return queryInterface.bulkInsert(
            table('company_event_name'),
            events.map(item => ({
                e_id: item.e_id,
                event_type: 'EVENT',
                event_name: item.event_name,
                event_slug: item.event_slug,
                event_subject: item.event_subject,
                color_code: item.color_code,
                recurring_period: 0,
                recurring_duration: '',
                is_system_event: Boolean(item.is_system_event),
                is_recurring: false,
                is_deleted: 0,
                updated_date: '2026-05-25 14:17:00',
                updated_by: 1,
            })),
            { ignoreDuplicates: true }
        );
    },

    down: async (queryInterface) => queryInterface.bulkDelete(
        table('company_event_name'),
        { event_slug: events.map(item => item.event_slug) },
        {}
    ),
};
