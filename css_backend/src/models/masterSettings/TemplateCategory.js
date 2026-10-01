'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class TemplateCategory extends Model {

        static associate(models) {
            // no association
        }

    }

    TemplateCategory.init(
        {

            tc_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            tc_name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },

            tc_slug: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
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

            modelName: 'template_category',

            tableName: table('template_category'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',

            underscored: true,

            indexes: [
                {
                    unique: true,
                    fields: ['tc_slug'],
                    name: 'uq_tc_slug',
                },
                {
                    fields: ['is_deleted'],
                    name: 'idx_tc_deleted',
                },
            ],
        }
    );

    return TemplateCategory;
};