'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        const segregations = [
            'Client',
            'Non-Client',
            'Local',
            'Foreign',            
            'Government Linked',
        ];

        return queryInterface.bulkInsert(
            table('company_segregation'),
            segregations.map((name, index) => ({
                segregation_id: index + 1,
                segregation_name: name,
                is_deleted: 0,
                updated_date: '2026-05-25 14:11:00',
                updated_by: 1,
            })),
            { ignoreDuplicates: true }
        );

    },

    down: async (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete(
            table('company_segregation'),
            {
                segregation_name: [
                    'Local',
                    'Foreign',
                    'Listed',
                    'Non-Listed',
                    'Government Linked',
                ],
            },
            {}
        );

    },

};
