'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class EntityIndividualDetail extends Model {

        static associate(models) {
            EntityIndividualDetail.belongsTo(models.entities, {
                foreignKey: 'entity_id',
                as: 'entity',
            });
        }

    }

    EntityIndividualDetail.init(
        {
            individual_detail_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            entity_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            salutation_id: {
                type: DataTypes.TINYINT.UNSIGNED,
                allowNull: true,
            },
            former_name: {
                type: DataTypes.STRING(300),
                allowNull: true,
            },
            member_alias_name: {
                type: DataTypes.STRING(200),
                allowNull: true,
            },
            member_assessment_rating: {
                type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'),
                allowNull: true,
            },
            member_gender: {
                type: DataTypes.ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'),
                allowNull: true,
            },
            member_dob: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            country_of_birth: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            country_of_birth_code: {
                type: DataTypes.CHAR(3),
                allowNull: true,
            },
            member_nationality: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            member_nationality_code: {
                type: DataTypes.CHAR(3),
                allowNull: true,
            },
            race_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                allowNull: true,
            },
            additional_notes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            father_name: {
                type: DataTypes.STRING(300),
                allowNull: true,
            },
            mother_name: {
                type: DataTypes.STRING(300),
                allowNull: true,
            },
            spouse_name: {
                type: DataTypes.STRING(300),
                allowNull: true,
            },
            preferred_contact_mode: {
                type: DataTypes.ENUM('EMAIL', 'MOBILE', 'TELEPHONE', 'WHATSAPP', 'FAX'),
                allowNull: true,
            },
            skype_id: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            alternate_email: {
                type: DataTypes.STRING(200),
                allowNull: true,
            },
            services_to_contact: {
                type: DataTypes.STRING(300),
                allowNull: true,
            },
            notice_from_email: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            notice_from_mobile_notify: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            notice_from_whatsapp: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            occupation: {
                type: DataTypes.STRING(200),
                allowNull: true,
            },
            employer_name: {
                type: DataTypes.STRING(300),
                allowNull: true,
            },
            tax_id: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            individual_admin_access: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            individual_group_access: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            is_pep: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            pep_details: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            is_deleted: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            created_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            created_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            updated_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            updated_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'entity_individual_details',
            tableName: table('entity_individual_details'),
            timestamps: false,
            createdAt: false,
            updatedAt: 'updated_date',
            underscored: true,
            indexes: [
                { fields: ['entity_id'],  name: 'idx_eid_entity' },
                { fields: ['is_deleted'], name: 'idx_eid_deleted' },
                { fields: ['is_pep'],     name: 'idx_eid_pep' },
            ],
        }
    );

    return EntityIndividualDetail;
};
