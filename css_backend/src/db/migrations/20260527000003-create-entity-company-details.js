'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('entity_company_details'), {

            company_detail_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            entity_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
            },
            corp_sec_id:                { type: Sequelize.SMALLINT.UNSIGNED, allowNull: true },
            segregation_id:             { type: Sequelize.SMALLINT.UNSIGNED, allowNull: true },
            bn_id:                      { type: Sequelize.SMALLINT.UNSIGNED, allowNull: true },
            service_id:                 { type: Sequelize.SMALLINT.UNSIGNED, allowNull: true },
            fee_id:                     { type: Sequelize.INTEGER.UNSIGNED,  allowNull: true },
            css_status_id:              { type: Sequelize.SMALLINT.UNSIGNED, allowNull: true },
            related_industry_id:        { type: Sequelize.SMALLINT.UNSIGNED, allowNull: true },
            software_id:                { type: Sequelize.SMALLINT.UNSIGNED, allowNull: true },
            ssic_id:                    { type: Sequelize.INTEGER.UNSIGNED,  allowNull: true },
            ssic_user_description:      { type: Sequelize.STRING(500),       allowNull: true },
            ssic_id_secondary:          { type: Sequelize.INTEGER.UNSIGNED,  allowNull: true, comment: 'Secondary SSIC' },
            ssic_user_description_secondary: { type: Sequelize.STRING(500),  allowNull: true },
            risk_assessment_rating: {
                type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'),
                allowNull: true,
            },
            public_interest_company:    { type: Sequelize.TINYINT(1), allowNull: false, defaultValue: 0 },
            jurisdiction_incorp_name:   { type: Sequelize.STRING(200), allowNull: true },
            jurisdiction_corp_name:     { type: Sequelize.STRING(200), allowNull: true },
            jurisdiction_corp_id:       { type: Sequelize.STRING(100), allowNull: true },
            country:                    { type: Sequelize.STRING(100), allowNull: true },
            country_id:                 { type: Sequelize.SMALLINT.UNSIGNED, allowNull: true },
            region_id:                  { type: Sequelize.SMALLINT.UNSIGNED, allowNull: true },
            company_incorporation_date: { type: Sequelize.DATEONLY, allowNull: true },
            company_takeover_date:      { type: Sequelize.DATEONLY, allowNull: true },
            dormant_date:               { type: Sequelize.DATEONLY, allowNull: true },
            strike_off_date:            { type: Sequelize.DATEONLY, allowNull: true },
            terminate_date:             { type: Sequelize.DATEONLY, allowNull: true },
            liquidated_date:            { type: Sequelize.DATEONLY, allowNull: true },
            cancelled_date:             { type: Sequelize.DATEONLY, allowNull: true },
            amalgamated_date:           { type: Sequelize.DATEONLY, allowNull: true },
            liquid_strike_off_date:     { type: Sequelize.DATEONLY, allowNull: true },
            company_fin_date:           { type: Sequelize.DATEONLY, allowNull: true, comment: 'Financial year end date' },
            mail_redirection:           { type: Sequelize.TINYINT(1), allowNull: false, defaultValue: 0 },
            holding_company_name:       { type: Sequelize.STRING(300), allowNull: true },
            holding_company_entity_id:  { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
            company_xbrl_required:      { type: Sequelize.TINYINT(1), allowNull: false, defaultValue: 0 },
            company_services_provided:  { type: Sequelize.JSON, allowNull: true, comment: 'JSON array of service IDs' },
            bank_id:                    { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
            logo_name:                  { type: Sequelize.STRING(300), allowNull: true },
            logo_url:                   { type: Sequelize.STRING(500), allowNull: true },
            admin_access:               { type: Sequelize.JSON, allowNull: true },
            group_access:               { type: Sequelize.JSON, allowNull: true },
            user_access:                { type: Sequelize.JSON, allowNull: true },
            person_in_charge:           { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
            source_from: {
                type: Sequelize.ENUM('FORM', 'DM', 'SCRIPT', 'API', 'MANUAL'),
                allowNull: false,
                defaultValue: 'MANUAL',
            },
            is_deleted:   { type: Sequelize.TINYINT(1), allowNull: false, defaultValue: 0 },
            created_date: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            created_by:   { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
            updated_date: { type: Sequelize.DATE, allowNull: true },
            updated_by:   { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        });

        await queryInterface.addIndex(table('entity_company_details'), ['entity_id'],               { name: 'uq_ecd_entity', unique: true });
        await queryInterface.addIndex(table('entity_company_details'), ['css_status_id'],            { name: 'idx_ecd_css_status' });
        await queryInterface.addIndex(table('entity_company_details'), ['corp_sec_id'],              { name: 'idx_ecd_corp_sec' });
        await queryInterface.addIndex(table('entity_company_details'), ['risk_assessment_rating'],   { name: 'idx_ecd_risk' });
        await queryInterface.addIndex(table('entity_company_details'), ['company_incorporation_date'],{ name: 'idx_ecd_incorp_date' });
        await queryInterface.addIndex(table('entity_company_details'), ['company_fin_date'],         { name: 'idx_ecd_fin_date' });
        await queryInterface.addIndex(table('entity_company_details'), ['region_id'],                { name: 'idx_ecd_region' });
        await queryInterface.addIndex(table('entity_company_details'), ['person_in_charge'],         { name: 'idx_ecd_person_charge' });
        await queryInterface.addIndex(table('entity_company_details'), ['holding_company_entity_id'],{ name: 'idx_ecd_holding' });
        await queryInterface.addIndex(table('entity_company_details'), ['source_from'],              { name: 'idx_ecd_source' });
        await queryInterface.addIndex(table('entity_company_details'), ['is_deleted'],               { name: 'idx_ecd_deleted' });

        await queryInterface.addConstraint(table('entity_company_details'), {
            fields: ['entity_id'],
            type: 'foreign key',
            name: 'fk_ecd_entity',
            references: { table: table('entities'), field: 'entity_id' },
            onDelete: 'CASCADE',
        });

        await queryInterface.addConstraint(table('entity_company_details'), {
            fields: ['region_id'],
            type: 'foreign key',
            name: 'fk_ecd_region',
            references: { table: table('region_master'), field: 'region_id' },
            onDelete: 'SET NULL',
        });

        await queryInterface.addConstraint(table('entity_company_details'), {
            fields: ['holding_company_entity_id'],
            type: 'foreign key',
            name: 'fk_ecd_holding',
            references: { table: table('entities'), field: 'entity_id' },
            onDelete: 'SET NULL',
        });

    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('entity_company_details'));
    },

};
