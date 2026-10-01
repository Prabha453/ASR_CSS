'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(table('official_master'), 'parent_slugs', {
            type:      Sequelize.STRING(500),
            allowNull: true,
            after:     'is_show',
        });

        // Proxy → directors + auditors; Nominator → directors only
        await queryInterface.bulkUpdate(
            table('official_master'),
            { parent_slugs: 'directors,auditors' },
            { official_master_slug: 'proxy' }
        );
        await queryInterface.bulkUpdate(
            table('official_master'),
            { parent_slugs: 'directors' },
            { official_master_slug: 'nominator' }
        );
    },

    async down(queryInterface) {
        await queryInterface.removeColumn(table('official_master'), 'parent_slugs');
    },

};
