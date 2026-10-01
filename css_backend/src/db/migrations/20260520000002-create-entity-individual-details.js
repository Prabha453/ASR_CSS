'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('entity_individual_details'), {

            individual_detail_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },

            entity_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
            },

            salutation_id: {
                type: Sequelize.TINYINT.UNSIGNED,
                allowNull: true,
            },

            former_name: {
                type: Sequelize.STRING(300),
                allowNull: true,
                comment: 'Individual Former Name',
            },

            member_alias_name: {
                type: Sequelize.STRING(200),
                allowNull: true,
                comment: 'Alias',
            },

            member_assessment_rating: {
                type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'),
                allowNull: true,
            },

            member_gender: {
                type: Sequelize.ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'),
                allowNull: true,
            },

            member_dob: {
                type: Sequelize.DATEONLY,
                allowNull: true,
                comment: 'Date of Birth',
            },

            country_of_birth: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },

            country_of_birth_code: {
                type: Sequelize.CHAR(3),
                allowNull: true,
            },

            member_nationality: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },

            member_nationality_code: {
                type: Sequelize.CHAR(3),
                allowNull: true,
            },

            race_id: {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: true,
            },

            additional_notes: {
                type: Sequelize.TEXT,
                allowNull: true,
            },

            father_name: {
                type: Sequelize.STRING(300),
                allowNull: true,
            },

            mother_name: {
                type: Sequelize.STRING(300),
                allowNull: true,
            },

            spouse_name: {
                type: Sequelize.STRING(300),
                allowNull: true,
            },

            preferred_contact_mode: {
                type: Sequelize.ENUM('EMAIL', 'MOBILE', 'TELEPHONE', 'WHATSAPP', 'FAX'),
                allowNull: true,
            },

            skype_id: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },

            alternate_email: {
                type: Sequelize.STRING(200),
                allowNull: true,
            },

            services_to_contact: {
                type: Sequelize.STRING(300),
                allowNull: true,
                comment: 'Services to contact for',
            },

            notice_from_email: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 1,
            },

            notice_from_mobile_notify: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },

            notice_from_whatsapp: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },

            occupation: {
                type: Sequelize.STRING(200),
                allowNull: true,
            },

            employer_name: {
                type: Sequelize.STRING(300),
                allowNull: true,
            },

            tax_id: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },

            individual_admin_access: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Admin permission matrix',
            },

            individual_group_access: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Group permission matrix',
            },

            is_pep: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },

            pep_details: {
                type: Sequelize.TEXT,
                allowNull: true,
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

        await queryInterface.addIndex(table('entity_individual_details'), ['entity_id'],             { name: 'uq_eid_entity', unique: true });
        await queryInterface.addIndex(table('entity_individual_details'), ['member_nationality_code'],{ name: 'idx_eid_nationality' });
        await queryInterface.addIndex(table('entity_individual_details'), ['member_dob'],             { name: 'idx_eid_dob' });
        await queryInterface.addIndex(table('entity_individual_details'), ['member_gender'],          { name: 'idx_eid_gender' });
        await queryInterface.addIndex(table('entity_individual_details'), ['is_pep'],                 { name: 'idx_eid_pep' });
        await queryInterface.addIndex(table('entity_individual_details'), ['race_id'],                { name: 'idx_eid_race' });
        await queryInterface.addIndex(table('entity_individual_details'), ['is_deleted'],             { name: 'idx_eid_deleted' });

        await queryInterface.addConstraint(table('entity_individual_details'), {
            fields: ['entity_id'],
            type: 'foreign key',
            name: 'fk_eid_entity',
            references: { table: table('entities'), field: 'entity_id' },
            onDelete: 'CASCADE',
        });

        await queryInterface.addConstraint(table('entity_individual_details'), {
            fields: ['race_id'],
            type: 'foreign key',
            name: 'fk_eid_race',
            references: { table: table('race_master'), field: 'race_id' },
            onDelete: 'SET NULL',
        });

        await queryInterface.addConstraint(table('entity_individual_details'), {
            fields: ['salutation_id'],
            type: 'foreign key',
            name: 'fk_eid_salutation',
            references: { table: table('salutation'), field: 'salutation_id' },
            onDelete: 'SET NULL',
        });

    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('entity_individual_details'));
    },

};
