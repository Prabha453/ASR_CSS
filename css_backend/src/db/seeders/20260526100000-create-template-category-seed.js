'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        const templateCategories = [
            { tc_id: 1, tc_name: 'AGM', tc_slug: 'agm' },
            { tc_id: 2, tc_name: 'AR', tc_slug: 'ar' },
            { tc_id: 3, tc_name: 'Director Resolution', tc_slug: 'director-resolution' },
            { tc_id: 4, tc_name: 'CDD Forms (RFA)', tc_slug: 'cdd-forms-rfa' },
            { tc_id: 5, tc_name: 'Incorporation', tc_slug: 'incorporation' },
            { tc_id: 6, tc_name: 'Onboarding', tc_slug: 'onboarding' },
            { tc_id: 7, tc_name: 'Dormant', tc_slug: 'dormant' },
            { tc_id: 8, tc_name: 'Form 45', tc_slug: 'form-45' },
            { tc_id: 9, tc_name: 'Form 45A', tc_slug: 'form-45a' },
        ];

        return queryInterface.bulkInsert(
            table('template_category'),
            templateCategories.map((item) => ({
                tc_id: item.tc_id,
                tc_name: item.tc_name,
                tc_slug: item.tc_slug,
                is_deleted: 0,
                updated_date: '2026-05-26 10:00:00',
                updated_by: 1,
            })),
            {
                ignoreDuplicates: true,
            }
        );

    },

    down: async (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete(
            table('template_category'),
            {
                tc_slug: [
                    'agm',
                    'ar',
                    'director-resolution',
                    'cdd-forms-rfa',
                    'incorporation',
                    'onboarding',
                    'dormant',
                    'form-45',
                    'form-45a',
                ],
            },
            {}
        );

    },

};
