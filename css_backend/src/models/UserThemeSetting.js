'use strict';

const { Model } = require('sequelize');
const table = require('../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class UserThemeSetting extends Model {
        static associate(models) {
            UserThemeSetting.belongsTo(models.user, {
                foreignKey: 'user_id',
                targetKey: 'user_id',
                as: 'user',
            });
        }
    }

    UserThemeSetting.init(
        {
            theme_setting_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            user_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                unique: true,
            },

            layout_type:            { type: DataTypes.STRING(50), allowNull: true },
            layout_mode_type:       { type: DataTypes.STRING(50), allowNull: true },
            left_sidebar_type:      { type: DataTypes.STRING(50), allowNull: true },
            layout_width_type:      { type: DataTypes.STRING(50), allowNull: true },
            layout_position_type:   { type: DataTypes.STRING(50), allowNull: true },
            topbar_theme_type:      { type: DataTypes.STRING(50), allowNull: true },
            leftsidbar_size_type:   { type: DataTypes.STRING(50), allowNull: true },
            left_sidebar_view_type: { type: DataTypes.STRING(50), allowNull: true },
            left_sidebar_image_type:{ type: DataTypes.STRING(50), allowNull: true },
            preloader:              { type: DataTypes.STRING(50), allowNull: true },
            sidebar_visibility_type:   { type: DataTypes.STRING(50), allowNull: true },
            breadcrumbs_visibility:    { type: DataTypes.STRING(10), allowNull: true, defaultValue: 'show' },
            footer_visibility:         { type: DataTypes.STRING(10), allowNull: true, defaultValue: 'show' },
            default_page_size:         { type: DataTypes.INTEGER, allowNull: true, defaultValue: 10 },

            created_date: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },

            updated_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'user_theme_settings',
            tableName: table('user_theme_settings'),
            timestamps: false,
        }
    );

    return UserThemeSetting;
};
