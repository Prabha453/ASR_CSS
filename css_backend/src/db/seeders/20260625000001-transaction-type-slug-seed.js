'use strict';

const table = require('../../helper/dbTable');

const slugMap = [
    { t_id: 1,  t_slug: 'pre-allotment' },
    { t_id: 2,  t_slug: 'allotment' },
    { t_id: 3,  t_slug: 'transfer' },
    { t_id: 4,  t_slug: 'dissolved' },
    { t_id: 5,  t_slug: 'cancel' },
    { t_id: 6,  t_slug: 'replace-lost-share-cert' },
    { t_id: 7,  t_slug: 'split-share-cert' },
    { t_id: 8,  t_slug: 'combine-shares' },
    { t_id: 9,  t_slug: 'share-increase' },
    { t_id: 10, t_slug: 'share-decrease' },
    { t_id: 11, t_slug: 'authorized-increase' },
    { t_id: 12, t_slug: 'capital-reduction' },
    { t_id: 13, t_slug: 'conversion' },
    { t_id: 14, t_slug: 'consolidation' },
    { t_id: 15, t_slug: 'subdivide' },
    { t_id: 16, t_slug: 'buyback' },
    { t_id: 17, t_slug: 'reduction' },
    { t_id: 18, t_slug: 'redemption' },
];

module.exports = {
    async up(queryInterface, Sequelize) {
        for (const item of slugMap) {
            await queryInterface.bulkUpdate(
                table('transaction_type'),
                { t_slug: item.t_slug },
                { t_id: item.t_id }
            );
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkUpdate(
            table('transaction_type'),
            { t_slug: null },
            { t_id: slugMap.map((i) => i.t_id) }
        );
    },
};
