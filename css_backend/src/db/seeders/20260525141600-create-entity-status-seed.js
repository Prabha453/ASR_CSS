'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        const statuses = [
            'Pre-Incorporation',
            'Active (Reminder Sending)',
            'Terminated',
            'Dormant (Reminder Sending)',
            'Liquidation in Progress',
            'Dissolved',
            'Striking Off',
            'Struck-Off',
            'De-Registered',
            'Inactive (Reminder Sending)',
            'Liquidated',
            'Cancelled',
            'Amalgamated',
        ];

        return queryInterface.bulkInsert(
            table('entity_status'),
            statuses.map((name, index) => ({
                e_status_id: index + 1,
                e_status_name: name,
                is_deleted: 0,
                updated_date: '2026-06-01 12:00:00',
                updated_by: 1,
            })),
            {
                ignoreDuplicates: true,
            }
        );

    },

    down: async (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete(
            table('entity_status'),
            {
                e_status_name: [
                    'Pre-Incorporation',
                    'Active (Reminder Sending)',
                    'Terminated',
                    'Dormant (Reminder Sending)',
                    'Liquidation in Progress',
                    'Dissolved',
                    'Striking Off',
                    'Struck-Off',
                    'De-Registered',
                    'Inactive (Reminder Sending)',
                    'Liquidated',
                    'Cancelled',
                    'Amalgamated',
                ],
            },
            {}
        );

    },

};