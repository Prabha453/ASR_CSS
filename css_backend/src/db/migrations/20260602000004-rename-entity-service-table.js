'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface) {

        await queryInterface.renameTable(
            table('entity_service'),
            table('entity_service_category')
        );

    },

    async down(queryInterface) {

        await queryInterface.renameTable(
            table('entity_service_category'),
            table('entity_service')
        );

    },

};