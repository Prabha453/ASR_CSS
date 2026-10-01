'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        const officialMasters = [
            { official_master_id: 1, official_master_name: 'Directors', official_master_slug: 'directors', official_order: 1 },
            { official_master_id: 2, official_master_name: 'Shareholders', official_master_slug: 'shareholders', official_order: 2 },
            { official_master_id: 3, official_master_name: 'Secretaries', official_master_slug: 'secretaries', official_order: 3 },
            { official_master_id: 4, official_master_name: 'Auditors', official_master_slug: 'auditors', official_order: 4 },
            { official_master_id: 5, official_master_name: 'Representatives', official_master_slug: 'representatives', official_order: 5 },
            { official_master_id: 6, official_master_name: 'CEOs', official_master_slug: 'ceos', official_order: 6 },
            { official_master_id: 7, official_master_name: 'Managers', official_master_slug: 'managers', official_order: 7 },
            { official_master_id: 8, official_master_name: 'Owners', official_master_slug: 'owners', official_order: 8 },
            { official_master_id: 9, official_master_name: 'Contact Persons', official_master_slug: 'contact-persons', official_order: 9 },
            { official_master_id: 10, official_master_name: 'Chairpersons', official_master_slug: 'chairpersons', official_order: 10 },
            { official_master_id: 11, official_master_name: 'Controllers', official_master_slug: 'controllers', official_order: 11 },
            { official_master_id: 12, official_master_name: 'Fund Managers', official_master_slug: 'fund-managers', official_order: 12 },
            { official_master_id: 13, official_master_name: 'Nominee and Trustees', official_master_slug: 'nominee-and-trustees', official_order: 13 },
            { official_master_id: 14, official_master_name: 'Data Protection Officers (DPOs)', official_master_slug: 'data-protection-officers-dpos', official_order: 14 },
            { official_master_id: 15, official_master_name: 'Presidents', official_master_slug: 'presidents', official_order: 15 },
            { official_master_id: 16, official_master_name: 'Treasurers', official_master_slug: 'treasurers', official_order: 16 },
            { official_master_id: 17, official_master_name: 'Commissioners', official_master_slug: 'commissioners', official_order: 17 },
            { official_master_id: 18, official_master_name: 'Legal Representatives', official_master_slug: 'legal-representatives', official_order: 18 },
            { official_master_id: 19, official_master_name: 'Supervisors', official_master_slug: 'supervisors', official_order: 19 },
            { official_master_id: 20, official_master_name: 'General Managers', official_master_slug: 'general-managers', official_order: 20 },
            { official_master_id: 21, official_master_name: 'Resident Representatives', official_master_slug: 'resident-representatives', official_order: 21 },
            { official_master_id: 22, official_master_name: 'Partners', official_master_slug: 'partners', official_order: 22 },
            { official_master_id: 23, official_master_name: 'Agent', official_master_slug: 'agent', official_order: 23 },
            { official_master_id: 24, official_master_name: 'Liquidator', official_master_slug: 'liquidator', official_order: 24 },
            { official_master_id: 25, official_master_name: 'Chief Representative', official_master_slug: 'chief-representative', official_order: 25 },
            { official_master_id: 26, official_master_name: 'Deputy Representative', official_master_slug: 'deputy-representative', official_order: 26 },
            { official_master_id: 27, official_master_name: 'EP Holder', official_master_slug: 'ep-holder', official_order: 27 },
            { official_master_id: 28, official_master_name: 'DP Holder', official_master_slug: 'dp-holder', official_order: 28 },
            { official_master_id: 29, official_master_name: 'Corporate Representative', official_master_slug: 'corporate-representative', official_order: 29 },
            { official_master_id: 30, official_master_name: 'UBO', official_master_slug: 'ubo', official_order: 30 },
        ];

        return queryInterface.bulkInsert(
            table('official_master'),
            officialMasters.map((item) => ({
                official_master_id: item.official_master_id,
                official_master_name: item.official_master_name,
                official_master_slug: item.official_master_slug,
                official_order: item.official_order,
                is_deleted: 0,
                updated_date: '2026-05-26 10:30:00',
                updated_by: 1,
            })),
            {
                ignoreDuplicates: true,
            }
        );

    },

    down: async (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete(
            table('official_master'),
            {
                official_master_slug: [
                    'directors',
                    'shareholders',
                    'secretaries',
                    'auditors',
                    'representatives',
                    'ceos',
                    'managers',
                    'owners',
                    'contact-persons',
                    'chairpersons',
                    'controllers',
                    'fund-managers',
                    'nominee-and-trustees',
                    'data-protection-officers-dpos',
                    'presidents',
                    'treasurers',
                    'commissioners',
                    'legal-representatives',
                    'supervisors',
                    'general-managers',
                    'resident-representatives',
                    'partners',
                    'agent',
                    'liquidator',
                    'chief-representative',
                    'deputy-representative',
                    'ep-holder',
                    'dp-holder',
                    'corporate-representative',
                    'ubo',
                ],
            },
            {}
        );

    },

};
