'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        const sharesColumns = await queryInterface.describeTable(table('entity_shares'));
        if (sharesColumns.share_allotment) {
            await queryInterface.renameColumn(table('entity_shares'), 'share_allotment', 'share_type');
        }

        const sharesHistoryColumns = await queryInterface.describeTable(table('entity_shares_history'));
        if (sharesHistoryColumns.share_allotment) {
            await queryInterface.renameColumn(table('entity_shares_history'), 'share_allotment', 'share_type');
        }

    },

    down: async (queryInterface, Sequelize) => {

        await queryInterface.renameColumn(table('entity_shares'), 'share_type', 'share_allotment');
        await queryInterface.renameColumn(table('entity_shares_history'), 'share_type', 'share_allotment');

    },

};
