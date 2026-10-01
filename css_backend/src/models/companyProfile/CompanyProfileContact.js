'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class CompanyProfileContact extends Model {

        static associate(models) {

            // association here if needed

        }

    }

    CompanyProfileContact.init(
        {
            profile_contact_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },

            cp_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
            },

            email_id: {
                type: DataTypes.STRING(200),
                allowNull: true,
            },

            reply_id: {
                type: DataTypes.STRING(200),
                allowNull: true,
            },

            phone_no: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },

            fax_no: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },

            created_on: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            updated_on: {
                type: DataTypes.DATE,
                allowNull: true,
            },

        },
        {
            sequelize,

            modelName: 'company_profile_contact',

            tableName: table('company_profile_contact'),

            timestamps: false,

            underscored: true,
        }
    );

    return CompanyProfileContact;

};