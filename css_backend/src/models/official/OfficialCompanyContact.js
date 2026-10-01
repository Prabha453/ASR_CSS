'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class OfficialCompanyContact extends Model {

        static associate(models) {

            OfficialCompanyContact.belongsTo(models.entities, {
                foreignKey: 'entity_id',
                as: 'entity',
            });

            OfficialCompanyContact.belongsTo(models.entities, {
                foreignKey: 'official_entity_id',
                targetKey: 'entity_id',
                as: 'company',
                constraints: false,
            });

            OfficialCompanyContact.hasMany(models.officials, {
                foreignKey: 'company_contact_id',
                as: 'officials',
            });
            
        }
    }

    OfficialCompanyContact.init(
        {

            contact_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            entity_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
            },

            official_entity_id: {
                type: DataTypes.TEXT,
                allowNull: false,
            },

            email: {
                type: DataTypes.TEXT,
                allowNull: false,
                defaultValue: '',
            },

            mobile: {
                type: DataTypes.STRING(30),
                allowNull: false,
                defaultValue: '',
            },

            mobile_code: {
                type: DataTypes.STRING(30),
                allowNull: false,
                defaultValue: '',
            },

            telephone: {
                type: DataTypes.STRING(30),
                allowNull: false,
                defaultValue: '',
            },

            telephone_code: {
                type: DataTypes.STRING(30),
                allowNull: false,
                defaultValue: '',
            },

            office: {
                type: DataTypes.STRING(30),
                allowNull: false,
                defaultValue: '',
            },

            office_code: {
                type: DataTypes.STRING(30),
                allowNull: false,
                defaultValue: '',
            },

            ext_no: {
                type: DataTypes.STRING(30),
                allowNull: false,
                defaultValue: '',
            },

            deleted: {
                type: DataTypes.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },

            created_date: {
                type: DataTypes.DATE,
                allowNull: false,
            },

            created_by: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
            },

        },
        {
            sequelize,
            modelName: 'official_company_contact',
            tableName: table('official_company_contact'),
            timestamps: false,
            underscored: true,
        }
    );

    return OfficialCompanyContact;

};