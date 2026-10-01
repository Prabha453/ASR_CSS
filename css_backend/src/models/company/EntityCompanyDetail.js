'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class EntityCompanyDetail extends Model {

        static associate(models) {
            EntityCompanyDetail.belongsTo(models.entities, {
                foreignKey: 'entity_id',
                as: 'entity',
            });

            EntityCompanyDetail.belongsTo(models.jurisdiction, {
                foreignKey: 'jurisdiction_id',
                as: 'jurisdiction',
            });

            EntityCompanyDetail.belongsTo(models.entity_status, {
                foreignKey: 'e_status_id',
                as: 'entity_status',
            });
        }

    }

    EntityCompanyDetail.init(
        {
            company_detail_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            entity_id:                       { type: DataTypes.BIGINT.UNSIGNED,   allowNull: false },
            corp_sec_id:                     { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
            segregation_ids:                 { type: DataTypes.STRING(500), allowNull: true },
            bn_ids:                          { type: DataTypes.STRING(500), allowNull: true },
            service_ids:                     { type: DataTypes.STRING(500), allowNull: true },
            fee_id:                          { type: DataTypes.INTEGER.UNSIGNED,  allowNull: true },
            e_status_id:                     { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
            related_industry_id:             { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
            software_id:                     { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
            ssic_id:                         { type: DataTypes.INTEGER.UNSIGNED,  allowNull: true },
            ssic_user_description:           { type: DataTypes.STRING(500),       allowNull: true },
            ssic_id_secondary:               { type: DataTypes.INTEGER.UNSIGNED,  allowNull: true },
            ssic_user_description_secondary: { type: DataTypes.STRING(500),       allowNull: true },
            risk_assessment_rating: {
                type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'),
                allowNull: true,
            },
            public_interest_company:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            location_common_seal_remarks: { type: DataTypes.TEXT, allowNull: true },
            jurisdiction_incorp_name:   { type: DataTypes.STRING(200), allowNull: true },
            jurisdiction_corp_name:     { type: DataTypes.STRING(200), allowNull: true },
            jurisdiction_corp_id:       { type: DataTypes.STRING(100), allowNull: true },
            country:                    { type: DataTypes.STRING(100), allowNull: true },
            country_id:                 { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
            region_id:                  { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
            jurisdiction_id:             { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
            company_incorporation_date: { type: DataTypes.DATEONLY, allowNull: true },
            company_takeover_date:      { type: DataTypes.DATEONLY, allowNull: true },
            company_fin_date:           { type: DataTypes.DATEONLY, allowNull: true },
            mail_redirection:           { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            holding_company_name:       { type: DataTypes.STRING(300), allowNull: true },
            holding_company_entity_id:  { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
            company_xbrl_required:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            company_services_provided:  { type: DataTypes.JSON, allowNull: true },
            bank_id:                    { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
            logo_name:                  { type: DataTypes.STRING(300), allowNull: true },
            logo_url:                   { type: DataTypes.STRING(500), allowNull: true },
            admin_access:               { type: DataTypes.JSON, allowNull: true },
            group_access:               { type: DataTypes.JSON, allowNull: true },
            user_access:                { type: DataTypes.JSON, allowNull: true },
            person_in_charge:           { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
            group_ids:                      { type: DataTypes.STRING(255), allowNull: true },
            referral_source:                { type: DataTypes.STRING(100), allowNull: true },
            company_referral_partner_id:    { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
            individual_referral_partner_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
            senior_partner_id:              { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
            lawyer_id:                      { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
            manager_id:                     { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
            source_from: {
                type: DataTypes.ENUM('FORM', 'DM', 'SCRIPT', 'API', 'MANUAL'),
                allowNull: false,
                defaultValue: 'MANUAL',
            },
            is_deleted:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            created_date: { type: DataTypes.DATE, allowNull: true },
            created_by:   { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
            updated_date: { type: DataTypes.DATE, allowNull: true },
            updated_by:   { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        },
        {
            sequelize,
            modelName: 'entity_company_details',
            tableName: table('entity_company_details'),
            timestamps: false,
            createdAt: false,
            updatedAt: 'updated_date',
            underscored: true,
            indexes: [
                { fields: ['entity_id'],               name: 'uq_ecd_entity',      unique: true },
                { fields: ['e_status_id'],              name: 'idx_ecd_e_status' },
                { fields: ['corp_sec_id'],              name: 'idx_ecd_corp_sec' },
                { fields: ['risk_assessment_rating'],   name: 'idx_ecd_risk' },
                { fields: ['company_incorporation_date'], name: 'idx_ecd_incorp_date' },
                { fields: ['region_id'],                name: 'idx_ecd_region' },
                { fields: ['is_deleted'],               name: 'idx_ecd_deleted' },
                { fields: ['jurisdiction_id'],           name: 'idx_ecd_jurisdiction_id' },
            ],
        }
    );

    return EntityCompanyDetail;
};
