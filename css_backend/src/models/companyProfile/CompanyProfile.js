'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class CompanyProfile extends Model {
        static associate(models) {
            CompanyProfile.hasMany(models.document_store, {
                foreignKey: 'module_record_id',
                sourceKey: 'cp_id',
                as: 'documents',
                constraints: false,
            });
        }
    }

    CompanyProfile.init(
        {
            // ── Primary Key ───────────────────────────────────────────────
            cp_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },

            // ── Company Info ──────────────────────────────────────────────
            cp_company_name: {
                type: DataTypes.STRING(300),
                allowNull: false,
            },

            cp_registration_no: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },

            cp_country: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },

            cp_registered_client: {
                type: DataTypes.TINYINT,
                allowNull: false,
                defaultValue: 0,
            },

            cp_mailling_address: {
                type: DataTypes.TINYINT,
                allowNull: false,
                defaultValue: 0,
            },

            // ── Registered Address ────────────────────────────────────────
            cp_reg_add_block: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },

            cp_registered_address: {
                type: DataTypes.STRING(500),
                allowNull: true,
            },

            cp_reg_add_building: {
                type: DataTypes.STRING(250),
                allowNull: true,
            },

            cp_reg_add_level: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },

            cp_reg_add_unit: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },

            cp_reg_add_pcode: {
                type: DataTypes.STRING(30),
                allowNull: true,
            },

            cp_port_title: {
                type: DataTypes.STRING(250),
                allowNull: true,
            },

            // ── Currency & GST ────────────────────────────────────────────
            cp_currency: {
                type: DataTypes.STRING(10),
                allowNull: false,
                defaultValue: 'SGD',
            },

            cp_gst: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },

            // ── AGM / Theme ───────────────────────────────────────────────
            cp_default_level_held_time: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },

            cp_theme_style: {
                type: DataTypes.STRING(100),
                allowNull: false,
                defaultValue: 'custom',
            },

            cp_caps_proper: {
                type: DataTypes.TINYINT,
                allowNull: false,
                defaultValue: 0,
            },

            // ── Decimal Settings ──────────────────────────────────────────
            cp_no_of_share_decimal_place: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },

            cp_paid_up_share_decimal_place: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },

            cp_issued_share_decimal_place: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },

            // ── Email & Contact ───────────────────────────────────────────
            cp_email_id: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            cp_reply_id: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            cp_contact_number: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            // ── Email Configuration ───────────────────────────────────────
            cp_email_config: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            // ── System ────────────────────────────────────────────────────
            cp_timezone_user: {
                type: DataTypes.STRING(200),
                allowNull: false,
                defaultValue: 'Asia/Singapore',
            },

            // ── Authorized Capital ────────────────────────────────────────
            cp_authorized_captial_countries: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            // ── Share Certificate ─────────────────────────────────────────
            cp_share_certificate_payment: {
                type: DataTypes.TINYINT,
                allowNull: false,
                defaultValue: 0,
            },

            cp_allotment_partial_payment_share_cert: {
                type: DataTypes.TINYINT,
                allowNull: false,
                defaultValue: 0,
            },

            cp_transfer_partial_payment_share_cert: {
                type: DataTypes.TINYINT,
                allowNull: false,
                defaultValue: 0,
            },

            cp_each_partial_payment_share_cert: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            
            // ── Audit ─────────────────────────────────────────────────────
            created_by: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
            },

            created_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            updated_by: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
            },

            updated_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            is_deleted: {
                type: DataTypes.TINYINT,
                allowNull: false,
                defaultValue: 0,
            },
        },
        {
            sequelize,
            modelName: 'company_profile',
            tableName: table('company_profile'),
            timestamps: false,
            underscored: false,
        }
    );

    return CompanyProfile;
};
