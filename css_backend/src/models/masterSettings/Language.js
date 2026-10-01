'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class Language extends Model {

        static associate(models) {
            // no association
        }

    }

    Language.init(
        {

            language_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            l_type: {
                type: DataTypes.STRING(20),
                allowNull: false,
                comment: 'e.g. LABEL, MESSAGE, TOOLTIP',
            },

            l_page: {
                type: DataTypes.STRING(100),
                allowNull: false,
                comment: 'Page or module identifier',
            },

            l_label: {
                type: DataTypes.STRING(200),
                allowNull: false,
                comment: 'Key',
            },

            l_value: {
                type: DataTypes.TEXT,
                allowNull: false,
                comment: 'Translated text',
            },

            locale: {
                type: DataTypes.STRING(10),
                allowNull: false,
                defaultValue: 'en',
                comment: 'BCP-47 locale code',
            },

            is_deleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
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

            modelName: 'language',

            tableName: table('language'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',

            underscored: true,

            indexes: [
                {
                    unique: true,
                    fields: ['l_page', 'l_label', 'locale'],
                    name: 'uq_language_key',
                },
                {
                    fields: ['locale'],
                    name: 'idx_language_locale',
                },
                {
                    fields: ['is_deleted'],
                    name: 'idx_language_deleted',
                },
            ],
        }
    );

    return Language;
};