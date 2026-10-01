'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        // Add is_show column after is_deleted
        await queryInterface.addColumn(table('official_master'), 'is_show', {
            type:         Sequelize.TINYINT(1),
            allowNull:    false,
            defaultValue: 0,
            after:        'is_deleted',
        });

        // Insert Proxy and Nominator as main roles (like Directors) with is_show = 1
        await queryInterface.bulkInsert(table('official_master'), [
            {
                official_master_id:   31,
                official_master_name: 'Proxy',
                official_master_slug: 'proxy',
                official_order:       31,
                is_deleted:           0,
                is_show:              1,
                is_representative:    0,
                is_entity_type:       'ALL',
                is_parent:            0,
                is_active:            0,
                updated_date:         new Date(),
                updated_by:           1,
            },
            {
                official_master_id:   32,
                official_master_name: 'Nominator',
                official_master_slug: 'nominator',
                official_order:       32,
                is_deleted:           0,
                is_show:              1,
                is_representative:    0,
                is_entity_type:       'ALL',
                is_parent:            0,
                is_active:            0,
                updated_date:         new Date(),
                updated_by:           1,
            },
        ], { ignoreDuplicates: true });
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete(table('official_master'), {
            official_master_slug: ['proxy', 'nominator'],
        }, {});
        await queryInterface.removeColumn(table('official_master'), 'is_show');
    },

};
