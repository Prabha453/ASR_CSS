'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('entity_tags'), {

            entity_tag_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },

            entity_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
            },

            tag_id: {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: false,
            },

            created_date: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },

            created_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },

        });

        await queryInterface.addIndex(table('entity_tags'), ['entity_id', 'tag_id'], { name: 'uq_entity_tag', unique: true });
        await queryInterface.addIndex(table('entity_tags'), ['entity_id'],           { name: 'idx_etag_entity' });
        await queryInterface.addIndex(table('entity_tags'), ['tag_id'],              { name: 'idx_etag_tag' });

        await queryInterface.addConstraint(table('entity_tags'), {
            fields: ['entity_id'],
            type: 'foreign key',
            name: 'fk_etag_entity',
            references: { table: table('entities'), field: 'entity_id' },
            onDelete: 'CASCADE',
        });

        await queryInterface.addConstraint(table('entity_tags'), {
            fields: ['tag_id'],
            type: 'foreign key',
            name: 'fk_etag_tag',
            references: { table: table('tag'), field: 'tag_id' },
            onDelete: 'CASCADE',
        });

    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('entity_tags'));
    },

};
