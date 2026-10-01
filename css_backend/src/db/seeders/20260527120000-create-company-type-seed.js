'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        const companyTypes = [
            { company_type_id: 1, company_type_name: 'Authorised Company', company_type_order: 1 },
            { company_type_id: 2, company_type_name: 'Branch Office', company_type_order: 2 },
            { company_type_id: 3, company_type_name: 'Business', company_type_order: 3 },
            { company_type_id: 4, company_type_name: 'Exempt Private Company Limited By Shares (EPC)', company_type_order: 4 },
            { company_type_id: 5, company_type_name: 'Exempted with limited liability (Cayman)', company_type_order: 5 },
            { company_type_id: 6, company_type_name: 'Foreign Company registered in Singapore', company_type_order: 6 },
            { company_type_id: 7, company_type_name: 'Global Business License (GBL)', company_type_order: 7 },
            { company_type_id: 8, company_type_name: 'International Business Company (IBC)', company_type_order: 8 },
            { company_type_id: 9, company_type_name: 'International Company (IC)', company_type_order: 9 },
            { company_type_id: 10, company_type_name: 'Limited Liability Partnership (LLP)', company_type_order: 10 },
            { company_type_id: 11, company_type_name: 'Limited Partnership', company_type_order: 11 },
            { company_type_id: 12, company_type_name: 'Local Company', company_type_order: 12 },
            { company_type_id: 13, company_type_name: 'Offshore Company', company_type_order: 13 },
            { company_type_id: 14, company_type_name: 'Partnership', company_type_order: 14 },
            { company_type_id: 15, company_type_name: 'Private Company Limited By Shares', company_type_order: 15 },
            { company_type_id: 16, company_type_name: 'Private Limited Company', company_type_order: 16 },
            { company_type_id: 17, company_type_name: 'Public Accounting Firm', company_type_order: 17 },
            { company_type_id: 18, company_type_name: 'Public Company Limited by Guarantee', company_type_order: 18 },
            { company_type_id: 19, company_type_name: 'Public Company Limited By Shares', company_type_order: 19 },
            { company_type_id: 20, company_type_name: 'Public Listed Company Limited by Shares', company_type_order: 20 },
            { company_type_id: 21, company_type_name: 'Sole Proprietorship', company_type_order: 21 },
            { company_type_id: 22, company_type_name: 'SOLE PROPRIETORSHIP/PARTNERSHIP', company_type_order: 22 },
            { company_type_id: 23, company_type_name: 'Unlimited Private Company', company_type_order: 23 },
            { company_type_id: 24, company_type_name: 'Unlimited Public Company', company_type_order: 24 },
            { company_type_id: 25, company_type_name: 'Variable Capital Company', company_type_order: 25 },
        ];

        return queryInterface.bulkInsert(
            table('company_type'),
            companyTypes.map((item) => ({
                company_type_id: item.company_type_id,
                company_type_name: item.company_type_name,
                company_type_order: item.company_type_order,
                is_deleted: 0,
                updated_date: '2026-05-27 12:00:00',
                updated_by: 1,
            })),
            {
                ignoreDuplicates: true,
            }
        );

    },

    down: async (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete(
            table('company_type'),
            {
                company_type_name: [
                    'Authorised Company',
                    'Branch Office',
                    'Business',
                    'Exempt Private Company Limited By Shares (EPC)',
                    'Exempted with limited liability (Cayman)',
                    'Foreign Company registered in Singapore',
                    'Global Business License (GBL)',
                    'International Business Company (IBC)',
                    'International Company (IC)',
                    'Limited Liability Partnership (LLP)',
                    'Limited Partnership',
                    'Local Company',
                    'Offshore Company',
                    'Partnership',
                    'Private Company Limited By Shares',
                    'Private Limited Company',
                    'Public Accounting Firm',
                    'Public Company Limited by Guarantee',
                    'Public Company Limited By Shares',
                    'Public Listed Company Limited by Shares',
                    'Sole Proprietorship',
                    'SOLE PROPRIETORSHIP/PARTNERSHIP',
                    'Unlimited Private Company',
                    'Unlimited Public Company',
                    'Variable Capital Company',
                ],
            },
            {}
        );

    },

};