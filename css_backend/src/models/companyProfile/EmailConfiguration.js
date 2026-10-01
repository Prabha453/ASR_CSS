'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class EmailConfiguration extends Model {

        static associate(models) {

            // association here if needed

        }

    }

    EmailConfiguration.init(
        {
            email_config_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },

            config_name: {
                type: DataTypes.STRING(150),
                allowNull: true,
            },

            smtp_host: {
                type: DataTypes.STRING(200),
                allowNull: true,
            },

            smtp_port: {
                type: DataTypes.SMALLINT.UNSIGNED,
                allowNull: true,
                defaultValue: 587,
            },

            smtp_user: {
                type: DataTypes.STRING(200),
                allowNull: true,
            },

            smtp_password: {
                type: DataTypes.STRING(500),
                allowNull: true,
            },

            smtp_encryption: {
                type: DataTypes.ENUM(
                    'NONE',
                    'TLS',
                    'SSL'
                ),
                allowNull: false,
                defaultValue: 'TLS',
            },

            sending_email: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },

            reply_email: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },

            from_name: {
                type: DataTypes.STRING(200),
                allowNull: true,
            },

            aws_ses: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: '1 - Verified',
            },

            group_to_recipient: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },

            is_default: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
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

            modelName: 'email_configuration',

            tableName: table('email_configuration'),

            timestamps: false,

            underscored: true,
        }
    );

    return EmailConfiguration;

};