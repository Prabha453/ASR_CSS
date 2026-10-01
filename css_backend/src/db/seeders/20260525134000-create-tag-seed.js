'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        const tags = [
            { tag_name: 'New', tag_color: '#FFF3B0' },
            { tag_name: 'Ongoing', tag_color: '#CFE8FF' },
            { tag_name: 'Process', tag_color: '#FFDDB3' },
            { tag_name: 'Testing', tag_color: '#E7DBFF' },
            { tag_name: 'Completed', tag_color: '#CFF5D3' },
        ];

        return queryInterface.bulkInsert(
            table('tag'),
            tags.map((item, index) => ({
                tag_id: index + 1,
                tag_name: item.tag_name,
                tag_color: item.tag_color,
                is_deleted: 0,
                updated_date: '2026-05-25 13:40:00',
                updated_by: 1,
            })),
            {
                ignoreDuplicates: true,
            }
        );

    },

    down: async (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete(
            table('tag'),
            {
                tag_name: [
                    'New',
                    'Ongoing',
                    'Process',
                    'Testing',
                    'Completed',
                ],
            },
            {}
        );

    },

};
