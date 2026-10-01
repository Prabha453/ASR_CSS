'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('entity_identification'), {

            identification_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },

            entity_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
            },

            entity_type: {
                type: Sequelize.ENUM('COMPANY', 'INDIVIDUAL'),
                allowNull: false,
            },

            m_identification_id: {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: true,
                comment: 'FK to member_id_type',
            },

            id_number: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },

            id_issued_country: {
                type: Sequelize.CHAR(3),
                allowNull: true,
            },

            id_issued_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },

            id_expired_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },

            document_url: {
                type: Sequelize.STRING(500),
                allowNull: true,
                comment: 'Uploaded document path',
            },

            document_name: {
                type: Sequelize.STRING(200),
                allowNull: true,
            },

            is_primary: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
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

        await queryInterface.addIndex(table('entity_identification'), ['entity_id'],          { name: 'idx_ident_entity' });
        await queryInterface.addIndex(table('entity_identification'), ['m_identification_id'], { name: 'idx_ident_type' });
        await queryInterface.addIndex(table('entity_identification'), ['is_deleted'],          { name: 'idx_ident_deleted' });

        await queryInterface.addConstraint(table('entity_identification'), {
            fields: ['entity_id'],
            type: 'foreign key',
            name: 'fk_ident_entity',
            references: { table: table('entities'), field: 'entity_id' },
            onDelete: 'CASCADE',
        });

        await queryInterface.addConstraint(table('entity_identification'), {
            fields: ['m_identification_id'],
            type: 'foreign key',
            name: 'fk_ident_mid',
            references: { table: table('member_id_type'), field: 'm_identification_id' },
            onDelete: 'SET NULL',
        });

    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('entity_identification'));
    },

};
