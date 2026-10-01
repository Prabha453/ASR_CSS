'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {
    class FormGenerationArtifact extends Model {
        static associate(models) {
            this.belongsTo(models.form_generation_run, { foreignKey: 'generation_run_id', as: 'generation_run' });
            this.belongsTo(models.document_store, { foreignKey: 'document_store_id', as: 'document' });
        }
    }
    FormGenerationArtifact.init({
        generation_artifact_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
        generation_run_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        artifact_type: { type: DataTypes.ENUM('HTML', 'PDF', 'DOCX'), allowNull: false },
        content_snapshot: { type: DataTypes.TEXT('long'), allowNull: true },
        content_hash: { type: DataTypes.STRING(64), allowNull: false },
        document_store_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        file_size_bytes: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false },
    }, {
        sequelize,
        modelName: 'form_generation_artifact',
        tableName: table('form_generation_artifacts'),
        timestamps: false,
        underscored: true,
    });
    return FormGenerationArtifact;
};
