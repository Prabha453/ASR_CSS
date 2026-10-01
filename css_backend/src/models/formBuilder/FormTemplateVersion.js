'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {
    class FormTemplateVersion extends Model {
        static associate(models) {
            this.belongsTo(models.form, { foreignKey: 'form_id', as: 'form' });
            this.hasMany(models.form_template_version_field, {
                foreignKey: 'template_version_id', as: 'fields',
            });
        }
    }

    FormTemplateVersion.init({
        template_version_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
        form_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        version_number: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        lifecycle_status: { type: DataTypes.ENUM('DRAFT', 'PUBLISHED', 'RETIRED'), allowNull: false, defaultValue: 'DRAFT' },
        source_type: { type: DataTypes.ENUM('HTML', 'DOCX'), allowNull: false, defaultValue: 'HTML' },
        content_snapshot: { type: DataTypes.TEXT('long'), allowNull: true },
        source_doc_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        popup_schema: { type: DataTypes.JSON, allowNull: true },
        layout_snapshot: { type: DataTypes.JSON, allowNull: false },
        content_hash: { type: DataTypes.STRING(64), allowNull: false },
        published_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        published_at: { type: DataTypes.DATE, allowNull: true },
        created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false },
    }, {
        sequelize,
        modelName: 'form_template_version',
        tableName: table('form_template_versions'),
        timestamps: false,
        underscored: true,
    });
    return FormTemplateVersion;
};
