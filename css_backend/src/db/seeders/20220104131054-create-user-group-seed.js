'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        return queryInterface.bulkInsert(
            table('user_group'),
            [
                {
                    group_name: 'Super Admin Group',

                    group_description:
                        'Full system access with all permissions',

                    permissions_json: JSON.stringify({
                        dashboard:    { view: true },
                        company:      { view: true, create: true, edit: true, delete: true },
                        individual:   { view: true, create: true, edit: true, delete: true },
                        officials:    { view: true, create: true, edit: true, delete: true },
                        users:        { view: true, create: true, edit: true, delete: true },
                        user_groups:  { view: true, create: true, edit: true, delete: true },
                        settings:     { view: true, create: true, edit: true, delete: true },
                    }),

                    is_deleted: 0,

                    created_date: new Date(),
                    created_by: null,

                    updated_date: new Date(),
                    updated_by: null,
                },
            ],
            {}
        );

    },

    down: async (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete(
            table('user_group'),
            null,
            {}
        );

    },

};