'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        const races = [
            'Chinese',
            'Malay',
            'Indian',
            'Eurasian',
            'Others',
        ];

        return queryInterface.bulkInsert(
            table('race_master'),
            races.map((raceName, index) => ({
                race_id: index + 1,
                race_name: raceName,
                is_deleted: 0,
                updated_date: '2026-05-25 13:20:00',
                updated_by: 1,
            })),
            {
                ignoreDuplicates: true,
            }
        );

    },

    down: async (queryInterface, Sequelize) => {

        const races = [
            'Chinese',
            'Malay',
            'Indian',
            'Eurasian',
            'Others',
        ];

        return queryInterface.bulkDelete(
            table('race_master'),
            {
                race_name: races,
            },
            {}
        );

    },

};
