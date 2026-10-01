'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        const shareClasses = [
            {
                sc_name: 'Ordinary',
                sc_slug: 'ordinary',
                sc_type: 'A',
            },
            {
                sc_name: 'Preference',
                sc_slug: 'preference',
                sc_type: '',
            },
        ];

        return queryInterface.bulkInsert(
            table('share_class_master'),
            shareClasses.map((item, index) => ({
                sc_id: index + 1,
                sc_name: item.sc_name,
                sc_slug: item.sc_slug,
                sc_type: item.sc_type,
                is_deleted: 0,
                updated_date: '2026-05-25 14:18:00',
                updated_by: 1,
            })),
            {
                ignoreDuplicates: true,
            }
        );

    },

    down: async (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete(
            table('share_class_master'),
            {
                sc_slug: [
                    'ordinary',
                    'preference',
                ],
            },
            {}
        );

    },

};
