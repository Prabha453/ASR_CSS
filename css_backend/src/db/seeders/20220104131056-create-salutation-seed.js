'use strict';


const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        return queryInterface.bulkInsert(
            table('salutation'),
            [
                { salutation_id: 1, salutation_name: 'Mr', is_deleted: 0, updated_date: '2026-05-25 09:07:57', updated_by: 1 },
                { salutation_id: 2, salutation_name: 'Dr', is_deleted: 0, updated_date: '2026-05-25 09:08:03', updated_by: 1 },
                { salutation_id: 3, salutation_name: 'Mrs', is_deleted: 0, updated_date: '2026-05-25 09:08:08', updated_by: 1 }
            ],
            {}
        );

    },

    down: async (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete(
            table('salutation'),
            {},
            {}
        );

    },

};