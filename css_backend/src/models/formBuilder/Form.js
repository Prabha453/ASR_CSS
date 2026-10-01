'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class Form extends Model {

        static associate(models) {
            // Define associations here
        }

    }

    Form.init(
        {

            form_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            category_id: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },

            form_name: {
                type: DataTypes.STRING(250),
                allowNull: false,
            },

            form_slug: {
                type: DataTypes.STRING(250),
                allowNull: false,
                unique: true,
            },

            template_id: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },

            save_us_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                defaultValue: 0,
            },

            old_form_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
            },

            save_us_name: {
                type: DataTypes.STRING(50),
                allowNull: false,
                defaultValue: '',
            },

            download_name: {
                type: DataTypes.STRING(250),
                allowNull: true,
            },

            form_content: {
                type: DataTypes.TEXT('long'),
                allowNull: false,
            },

            popup_fields: {
                type: DataTypes.JSON,
                allowNull: true,
            },

            form_type: {
                type: DataTypes.TINYINT,
                allowNull: false,
                defaultValue: 0,
                comment: '0-Form Builder, 1-E-Sign, 2-Manual',
            },

            orientation: {
                type: DataTypes.ENUM(
                    'Portrait',
                    'Landscape'
                ),
                allowNull: false,
                defaultValue: 'Portrait',
            },

            margin_top: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: false,
                defaultValue: 1.76,
            },

            margin_right: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: false,
                defaultValue: 1.76,
            },

            margin_bottom: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: false,
                defaultValue: 1.76,
            },

            margin_left: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: false,
                defaultValue: 1.76,
            },

            header_margin: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: false,
                defaultValue: 1.25,
            },

            footer_margin: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: false,
                defaultValue: 1.25,
            },

            country_code: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },

            default_library: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },

            pdpa_required: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            assigned_user_id: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },

            status: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: '1-Active, 0-Inactive',
            },

            is_deleted: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            created_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },

            updated_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

            updated_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },

        },
        {
            sequelize,

            modelName: 'form',

            tableName: table('forms'),

            timestamps: false,

            createdAt: false,

            updatedAt: false,

            underscored: true,
        }
    );

    return Form;
};
