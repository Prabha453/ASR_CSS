'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {
    class FormShortcodeDefinition extends Model {
        static associate(models) {
            if (models.form_shortcode_alias) {
                this.hasMany(models.form_shortcode_alias, {
                    foreignKey: 'shortcode_id',
                    as: 'aliases',
                });
            }
        }
    }

    FormShortcodeDefinition.init({
        shortcode_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
        shortcode_key: { type: DataTypes.STRING(190), allowNull: false, unique: true },
        label: { type: DataTypes.STRING(190), allowNull: false },
        source_domain: { type: DataTypes.ENUM('COMPANY', 'OFFICIAL', 'SHARE', 'EVENT', 'COMMON', 'TRANSACTION', 'MANUAL', 'CALCULATED', 'DOCUMENT', 'SYSTEM'), allowNull: false },
        sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
        resolver_name: { type: DataTypes.STRING(100), allowNull: false },
        resolver_path: { type: DataTypes.STRING(190), allowNull: false },
        value_type: { type: DataTypes.ENUM('STRING', 'TEXT', 'BOOLEAN', 'INTEGER', 'DECIMAL', 'MONEY', 'DATE', 'DATETIME', 'EMAIL', 'ADDRESS', 'FILE_REFERENCE', 'JSON'), allowNull: false, defaultValue: 'STRING' },
        is_collection: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        sensitivity: { type: DataTypes.ENUM('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'), allowNull: false, defaultValue: 'INTERNAL' },
        description: { type: DataTypes.TEXT, allowNull: true },
        example_value: { type: DataTypes.TEXT, allowNull: true },
        allowed_formats: { type: DataTypes.JSON, allowNull: true },
        selection_behavior: { type: DataTypes.ENUM('NONE', 'ALL', 'SELECT_ONE', 'SELECT_MANY'), allowNull: false, defaultValue: 'NONE' },
        role_tags: { type: DataTypes.JSON, allowNull: true },
        semantic_fingerprint: { type: DataTypes.STRING(64), allowNull: false },
        status: { type: DataTypes.ENUM('ACTIVE', 'DEPRECATED', 'RETIRED'), allowNull: false, defaultValue: 'ACTIVE' },
        is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false },
        updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        updated_at: { type: DataTypes.DATE, allowNull: true },
    }, {
        sequelize,
        modelName: 'form_shortcode_definition',
        tableName: table('form_shortcode_definitions'),
        timestamps: false,
        underscored: true,
    });

    return FormShortcodeDefinition;
};
