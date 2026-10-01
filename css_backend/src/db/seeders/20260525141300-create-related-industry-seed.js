'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        const industries = [
            'Information Technology',
            'Financial Services',
            'Healthcare',
            'Manufacturing',
            'Real Estate',
        ];

        return queryInterface.bulkInsert(
            table('related_industry'),
            industries.map((name, index) => ({
                related_industry_id: index + 1,
                related_industry_name: name,
                is_deleted: 0,
                updated_date: '2026-05-25 14:13:00',
                updated_by: 1,
            })),
            { ignoreDuplicates: true }
        );

    },

    down: async (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete(
            table('related_industry'),
            {
                related_industry_name: [
                    'Information Technology',
                    'Financial Services',
                    'Healthcare',
                    'Manufacturing',
                    'Real Estate',
                ],
            },
            {}
        );

    },

};
