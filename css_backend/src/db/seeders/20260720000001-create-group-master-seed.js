'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        const groups = ['VIP', 'Basic', 'Individual'];

        return queryInterface.bulkInsert(
            table('group_master'),
            groups.map((name, index) => ({
                group_id: index + 1,
                group_name: name,
                is_deleted: 0,
                updated_date: '2026-07-20 10:00:00',
                updated_by: 1,
            })),
            { ignoreDuplicates: true }
        );

    },

    down: async (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete(
            table('group_master'),
            {
                group_name: ['VIP', 'Basic', 'Individual'],
            },
            {}
        );

    },

};
