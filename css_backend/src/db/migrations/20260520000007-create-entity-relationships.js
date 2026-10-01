'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('entity_relationships'), {

            relationship_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },

            entity_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'The individual',
            },

            related_name: {
                type: Sequelize.STRING(300),
                allowNull: true,
                comment: 'Free text name if no entity link',
            },

            related_entity_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'FK if related person is also in system',
            },

            relationship_type: {
                type: Sequelize.ENUM('FATHER', 'MOTHER', 'SPOUSE', 'SIBLING', 'CHILD', 'OTHER'),
                allowNull: false,
            },

            is_deleted: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
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

            updated_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },

            updated_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },

        });

        await queryInterface.addIndex(table('entity_relationships'), ['entity_id'],        { name: 'idx_rel_entity' });
        await queryInterface.addIndex(table('entity_relationships'), ['relationship_type'], { name: 'idx_rel_type' });
        await queryInterface.addIndex(table('entity_relationships'), ['is_deleted'],        { name: 'idx_rel_deleted' });

        await queryInterface.addConstraint(table('entity_relationships'), {
            fields: ['entity_id'],
            type: 'foreign key',
            name: 'fk_rel_entity',
            references: { table: table('entities'), field: 'entity_id' },
            onDelete: 'CASCADE',
        });

        await queryInterface.addConstraint(table('entity_relationships'), {
            fields: ['related_entity_id'],
            type: 'foreign key',
            name: 'fk_rel_related',
            references: { table: table('entities'), field: 'entity_id' },
            onDelete: 'SET NULL',
        });

    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('entity_relationships'));
    },

};
