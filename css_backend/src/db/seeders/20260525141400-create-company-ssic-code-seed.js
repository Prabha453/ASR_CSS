'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        const ssicCodes = [
            {
                ssic_code: '62011',
                ssic_description: 'Development of software and applications',
                country: 'Singapore',
                country_code: 'SGP',
            },
            {
                ssic_code: '70100',
                ssic_description: 'Activities of head and regional head offices',
                country: 'Singapore',
                country_code: 'SGP',
            },
            {
                ssic_code: '69201',
                ssic_description: 'Accounting and auditing services',
                country: 'Singapore',
                country_code: 'SGP',
            },
            {
                ssic_code: '70201',
                ssic_description: 'Business and management consultancy services',
                country: 'Singapore',
                country_code: 'SGP',
            },
            {
                ssic_code: '68104',
                ssic_description: 'Real estate developers',
                country: 'Singapore',
                country_code: 'SGP',
            },
        ];

        return queryInterface.bulkInsert(
            table('company_ssic_code'),
            ssicCodes.map((item, index) => ({
                ssic_id: index + 1,
                ssic_code: item.ssic_code,
                ssic_description: item.ssic_description,
                country: item.country,
                country_code: item.country_code,
                is_deleted: 0,
                updated_date: '2026-05-25 14:14:00',
                updated_by: 1,
            })),
            { ignoreDuplicates: true }
        );

    },

    down: async (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete(
            table('company_ssic_code'),
            {
                ssic_code: [
                    '62011',
                    '70100',
                    '69201',
                    '70201',
                    '68104',
                ],
                country_code: 'SGP',
            },
            {}
        );

    },

};
