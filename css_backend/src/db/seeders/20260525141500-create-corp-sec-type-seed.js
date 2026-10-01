'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        const corpSecTypes = [
            'In-house Corporate Secretary',
            'Outsourced Corporate Secretary',
            'Professional Firm',
            'Nominee Secretary',
            'Interim Secretary',
        ];

        return queryInterface.bulkInsert(
            table('corp_sec_type'),
            corpSecTypes.map((name, index) => ({
                corp_sec_id: index + 1,
                corp_sec_parent: null,
                corp_sec_name: name,
                files: null,
                is_deleted: 0,
                updated_date: '2026-05-25 14:15:00',
                updated_by: 1,
            })),
            { ignoreDuplicates: true }
        );

    },

    down: async (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete(
            table('corp_sec_type'),
            {
                corp_sec_name: [
                    'In-house Corporate Secretary',
                    'Outsourced Corporate Secretary',
                    'Professional Firm',
                    'Nominee Secretary',
                    'Interim Secretary',
                ],
            },
            {}
        );

    },

};
