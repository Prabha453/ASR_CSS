'use strict';

const { Model } = require('sequelize');

const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class CssStatus extends Model {

        static associate(models) {
            // no association
        }

    }

    CssStatus.init(
        {

            css_status_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            css_status_name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },

            css_status_color: {
                type: DataTypes.STRING(10),
                allowNull: true,
                defaultValue: '#6C757D',
                comment: 'Badge color hex',
            },

            is_deleted: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
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

            modelName: 'css_status',

            tableName: table('css_status'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',

            underscored: true,

            indexes: [
                {
                    fields: ['is_deleted'],
                    name: 'idx_css_status_deleted',
                },
            ],
        }
    );

    return CssStatus;

};