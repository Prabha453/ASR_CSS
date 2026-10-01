'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {
        const t = table('share_transactions');

        await queryInterface.renameColumn(t, 'transferee_entity_id', 'transferee_official_entity_id');
        await queryInterface.renameColumn(t, 'transferee_share_id',  'transferee_share_transaction_id');
        await queryInterface.renameColumn(t, 'transferor_entity_id', 'transferor_official_entity_id');
        await queryInterface.renameColumn(t, 'transferor_share_id',  'transferor_share_transaction_id');
    },

    async down(queryInterface, Sequelize) {
        const t = table('share_transactions');

        await queryInterface.renameColumn(t, 'transferee_official_entity_id',   'transferee_entity_id');
        await queryInterface.renameColumn(t, 'transferee_share_transaction_id', 'transferee_share_id');
        await queryInterface.renameColumn(t, 'transferor_official_entity_id',   'transferor_entity_id');
        await queryInterface.renameColumn(t, 'transferor_share_transaction_id', 'transferor_share_id');
    },

};
