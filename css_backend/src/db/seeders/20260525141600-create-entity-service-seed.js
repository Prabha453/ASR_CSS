'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        const services = [
            {
                service_name: 'Company Incorporation',
                service_description: 'End-to-end company incorporation support.',
            },
            {
                service_name: 'Annual Filing',
                service_description: 'Preparation and filing of annual returns.',
            },
            {
                service_name: 'Bookkeeping',
                service_description: 'Routine bookkeeping and management reporting.',
            },
            {
                service_name: 'Tax Compliance',
                service_description: 'Corporate tax filing and compliance support.',
            },
            {
                service_name: 'Payroll Services',
                service_description: 'Payroll calculation, CPF and statutory submissions.',
            },
        ];

        return queryInterface.bulkInsert(
            table('entity_service_category'),
            services.map((item, index) => ({
                service_id: index + 1,
                service_name: item.service_name,
                service_description: item.service_description,
                service_image: null,
                is_deleted: 0,
                updated_date: '2026-05-25 14:16:00',
                updated_by: 1,
            })),
            { ignoreDuplicates: true }
        );

    },

    down: async (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete(
            table('entity_service_category'),
            {
                service_name: [
                    'Company Incorporation',
                    'Annual Filing',
                    'Bookkeeping',
                    'Tax Compliance',
                    'Payroll Services',
                ],
            },
            {}
        );

    },

};
