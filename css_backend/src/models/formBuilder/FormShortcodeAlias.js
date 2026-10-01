'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {
    class FormShortcodeAlias extends Model {
        static associate(models) {
            if (models.form_shortcode_definition) {
                this.belongsTo(models.form_shortcode_definition, {
                    foreignKey: 'shortcode_id',
                    as: 'definition',
                });
            }
        }
    }

    FormShortcodeAlias.init({
        alias_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
        shortcode_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        alias_key: { type: DataTypes.STRING(190), allowNull: false, unique: true },
        is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false },
    }, {
        sequelize,
        modelName: 'form_shortcode_alias',
        tableName: table('form_shortcode_aliases'),
        timestamps: false,
        underscored: true,
    });

    return FormShortcodeAlias;
};
