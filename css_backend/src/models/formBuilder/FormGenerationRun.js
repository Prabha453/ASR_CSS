'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {
    class FormGenerationRun extends Model {
        static associate(models) {
            this.belongsTo(models.form, { foreignKey: 'form_id', as: 'form' });
            this.belongsTo(models.form_template_version, { foreignKey: 'template_version_id', as: 'template_version' });
            this.belongsTo(models.entities, { foreignKey: 'entity_id', as: 'entity' });
            this.hasMany(models.form_generation_artifact, { foreignKey: 'generation_run_id', as: 'artifacts' });
            this.belongsTo(models.form_generation_run, { foreignKey: 'source_generation_run_id', as: 'source_run' });
            this.hasMany(models.form_generation_run, { foreignKey: 'source_generation_run_id', as: 'regenerated_runs' });
        }
    }
    FormGenerationRun.init({
        generation_run_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
        idempotency_key: { type: DataTypes.STRING(128), allowNull: false },
        request_hash: { type: DataTypes.STRING(64), allowNull: false },
        form_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        template_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        entity_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        source_generation_run_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        lifecycle_status: { type: DataTypes.ENUM('VALIDATING', 'READY', 'RENDERING', 'COMPLETED', 'FAILED'), allowNull: false },
        template_content_hash: { type: DataTypes.STRING(64), allowNull: false },
        selection_snapshot: { type: DataTypes.JSON, allowNull: false },
        resolved_snapshot: { type: DataTypes.JSON, allowNull: false },
        popup_schema_snapshot: { type: DataTypes.JSON, allowNull: false },
        template_content_snapshot: { type: DataTypes.TEXT('long'), allowNull: true },
        layout_snapshot: { type: DataTypes.JSON, allowNull: true },
        template_fields_snapshot: { type: DataTypes.JSON, allowNull: true },
        failure_code: { type: DataTypes.STRING(80), allowNull: true },
        failure_message: { type: DataTypes.STRING(1000), allowNull: true },
        created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false },
        updated_at: { type: DataTypes.DATE, allowNull: false },
        completed_at: { type: DataTypes.DATE, allowNull: true },
    }, {
        sequelize,
        modelName: 'form_generation_run',
        tableName: table('form_generation_runs'),
        timestamps: false,
        underscored: true,
    });
    return FormGenerationRun;
};
