'use strict';

const table = require('../../helper/dbTable');

// entities.default_address_id and entities.default_contact_id reference
// entity_address and entity_contact respectively. Those tables depend on
// entities, so the FK constraints must be added after both child tables exist.

module.exports = {

    async up(queryInterface) {

        await queryInterface.addConstraint(table('entities'), {
            fields: ['default_address_id'],
            type: 'foreign key',
            name: 'fk_entity_default_address',
            references: { table: table('entity_address'), field: 'address_id' },
            onDelete: 'SET NULL',
        });

        await queryInterface.addConstraint(table('entities'), {
            fields: ['default_contact_id'],
            type: 'foreign key',
            name: 'fk_entity_default_contact',
            references: { table: table('entity_contact'), field: 'contact_id' },
            onDelete: 'SET NULL',
        });

    },

    async down(queryInterface) {

        await queryInterface.removeConstraint(table('entities'), 'fk_entity_default_contact');
        await queryInterface.removeConstraint(table('entities'), 'fk_entity_default_address');

    },

};
