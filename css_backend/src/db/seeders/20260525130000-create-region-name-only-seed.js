'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        const regions = [
            'Caribbean',
            'Middle East',
            'Africa',
            'Oceania',
            'South America',
            'North America',
            'Asia',
            'Europe',
            'Arab States',
            'South Africa',
        ];

        return queryInterface.bulkInsert(
            table('region_master'),
            regions.map((regionName, index) => ({
                region_id: index + 1,
                region_name: regionName,             
                is_deleted: 0,
                updated_date: '2026-05-25 13:00:00',
                updated_by: 1,
            })),
            {
                ignoreDuplicates: true,
            }
        );

    },

    down: async (queryInterface, Sequelize) => {

        const regions = [
            'Caribbean',
            'Middle East',
            'Africa',
            'Oceania',
            'South America',
            'North America',
            'Asia',
            'Europe',
            'Arab States',
            'South Africa',
        ];

        return queryInterface.bulkDelete(
            table('region_master'),
            {
                region_name: regions,
            },
            {}
        );

    },

};
