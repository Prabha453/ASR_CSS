'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        const entities = [
            'Corpsec Client',
            'Taxation Client',
            'Accounting Client',
            'Audit Client',
            'Outsource Accounting Clients',
            'Outsource Tax Clients',
            'Payroll Client',
            'Compilation Client',
            'ASK Client',
            'M & A Client',
            'HR Client',
            'Scrutinisation Client',
            'GST Client',
            'WP / EP Client',
            'Commercial Accounting Client',
            'Personal Tax',
            'Auditor',
            'Corporate Shareholder',
            'Fund Management',
            'Corporate Director',
            'Corporate Owner',
            'External Corp Sec',
            'Sub Fund',
            'Agent',
            'Corporate Controller',
            'Corporate Partner',
            'Representative Office',
            'ODI',
            'Resident Representative',
            'Liquidator',
            'HRS Client',
            'Payment Client',
            'Fund Accounting',
            'Nominee Director',
            'Adhoc',
            'Insurance Client',
            'IT Client',
            'Trust/Fund',
        ];

        return queryInterface.bulkInsert(
            table('business_entity'),
            entities.map((name) => ({
                bs_name: name,
                is_deleted: 0,
                updated_date: '2026-05-25 14:12:00',
                updated_by: 1,
            })),
            { ignoreDuplicates: true }
        );

    },

    down: async (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete(
            table('business_entity'),
            {
                bs_name: [
                    'Corpsec Client',
                    'Taxation Client',
                    'Accounting Client',
                    'Audit Client',
                    'Outsource Accounting Clients',
                    'Outsource Tax Clients',
                    'Payroll Client',
                    'Compilation Client',
                    'ASK Client',
                    'M & A Client',
                    'HR Client',
                    'Scrutinisation Client',
                    'GST Client',
                    'WP / EP Client',
                    'Commercial Accounting Client',
                    'Personal Tax',
                    'Auditor',
                    'Corporate Shareholder',
                    'Fund Management',
                    'Corporate Director',
                    'Corporate Owner',
                    'External Corp Sec',
                    'Sub Fund',
                    'Agent',
                    'Corporate Controller',
                    'Corporate Partner',
                    'Representative Office',
                    'ODI',
                    'Resident Representative',
                    'Liquidator',
                    'HRS Client',
                    'Payment Client',
                    'Fund Accounting',
                    'Nominee Director',
                    'Adhoc',
                    'Insurance Client',
                    'IT Client',
                    'Trust/Fund',
                ],
            },
            {}
        );

    },

};
