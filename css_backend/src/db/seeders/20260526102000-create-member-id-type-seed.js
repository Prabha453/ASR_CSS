'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        const memberIdTypes = [
            { m_identification_id: 1, id_name: 'NRIC', slug_name: 'nric', country_code: null },
            { m_identification_id: 2, id_name: 'NRIC (Permanent Resident)', slug_name: 'nric-permanent-resident', country_code: 'SGP' },
            { m_identification_id: 3, id_name: 'NRIC (Singapore Citizen)', slug_name: 'nric-singapore-citizen', country_code: 'SGP' },
            { m_identification_id: 4, id_name: 'Passport', slug_name: 'passport', country_code: null },
            { m_identification_id: 5, id_name: 'FIN', slug_name: 'fin', country_code: 'SGP' },
            { m_identification_id: 6, id_name: 'NRIC Malaysia', slug_name: 'nric-malaysia', country_code: 'MYS' },
            { m_identification_id: 7, id_name: 'Aadhar Card', slug_name: 'aadhar-card', country_code: 'IND' },
            { m_identification_id: 8, id_name: 'Pan', slug_name: 'pan', country_code: 'IND' },
            { m_identification_id: 9, id_name: 'OTHERS', slug_name: 'others', country_code: null },
            
        ];

        return queryInterface.bulkInsert(
            table('member_id_type'),
            memberIdTypes.map((item) => ({
                m_identification_id: item.m_identification_id,
                id_name: item.id_name,
                slug_name: item.slug_name,
                country_code: item.country_code,
                is_deleted: 0,
                updated_date: '2026-05-26 10:20:00',
                updated_by: 1,
            })),
            {
                ignoreDuplicates: true,
            }
        );

    },

    down: async (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete(
            table('member_id_type'),
            {
                slug_name: [
                    'nric',
                    'nric-permanent-resident',
                    'nric-singapore-citizen',
                    'passport',
                    'nric-malaysia',
                    'aadhar-card',
                    'pan',
                    'others',
                    'fin',
                ],
            },
            {}
        );

    },

};
