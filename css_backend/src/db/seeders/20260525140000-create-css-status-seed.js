'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        const statuses = [
            { css_status_name: 'New', css_status_color: '#FFF3B0' },
            { css_status_name: 'Ongoing', css_status_color: '#CFE8FF' },
            { css_status_name: 'Process', css_status_color: '#FFDDB3' },
            { css_status_name: 'Testing', css_status_color: '#E7DBFF' },
            { css_status_name: 'Completed', css_status_color: '#CFF5D3' },
        ];

        return queryInterface.bulkInsert(
            table('css_status'),
            statuses.map((item, index) => ({
                css_status_id: index + 1,
                css_status_name: item.css_status_name,
                css_status_color: item.css_status_color,
                is_deleted: 0,
                updated_date: '2026-05-25 14:00:00',
                updated_by: 1,
            })),
            {
                ignoreDuplicates: true,
            }
        );

    },

    down: async (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete(
            table('css_status'),
            {
                css_status_name: [
                    'New',
                    'Ongoing',
                    'Process',
                    'Testing',
                    'Completed',
                ],
            },
            {}
        );

    },

};
