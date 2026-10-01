'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {
    class FormTemplateVersionField extends Model {
        static associate(models) {
            this.belongsTo(models.form_template_version, {
                foreignKey: 'template_version_id', as: 'version',
            });
            this.belongsTo(models.form_shortcode_definition, {
                foreignKey: 'shortcode_id', as: 'shortcode',
            });
        }
    }

    FormTemplateVersionField.init({
        version_field_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
        template_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        shortcode_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        original_key: { type: DataTypes.STRING(190), allowNull: false },
        canonical_key: { type: DataTypes.STRING(190), allowNull: true },
        formatters: { type: DataTypes.JSON, allowNull: false },
        occurrences: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
        is_block: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        is_required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        validation_status: { type: DataTypes.ENUM('VALID', 'UNKNOWN', 'INVALID_FORMAT'), allowNull: false },
        validation_message: { type: DataTypes.STRING(500), allowNull: true },
    }, {
        sequelize,
        modelName: 'form_template_version_field',
        tableName: table('form_template_version_fields'),
        timestamps: false,
        underscored: true,
    });
    return FormTemplateVersionField;
};
