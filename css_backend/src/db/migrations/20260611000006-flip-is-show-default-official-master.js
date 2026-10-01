'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {
        // Change default to 1 (normal officials are visible in dropdown)
        await queryInterface.changeColumn(table('official_master'), 'is_show', {
            type:         Sequelize.TINYINT(1),
            allowNull:    false,
            defaultValue: 1,
        });

        // Set all existing rows to 1 (they're all normal officials)
        await queryInterface.bulkUpdate(table('official_master'), { is_show: 1 }, {});

        // Proxy and Nominator are special roles — hide from main dropdown
        await queryInterface.bulkUpdate(
            table('official_master'),
            { is_show: 0 },
            { official_master_slug: 'proxy' }
        );
        await queryInterface.bulkUpdate(
            table('official_master'),
            { is_show: 0 },
            { official_master_slug: 'nominator' }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn(table('official_master'), 'is_show', {
            type:         Sequelize.TINYINT(1),
            allowNull:    false,
            defaultValue: 0,
        });
        // Revert: set all to 0, set proxy/nominator to 1
        await queryInterface.bulkUpdate(table('official_master'), { is_show: 0 }, {});
        await queryInterface.bulkUpdate(
            table('official_master'),
            { is_show: 1 },
            { official_master_slug: 'proxy' }
        );
        await queryInterface.bulkUpdate(
            table('official_master'),
            { is_show: 1 },
            { official_master_slug: 'nominator' }
        );
    },

};
