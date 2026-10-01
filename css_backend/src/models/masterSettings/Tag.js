'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class Tag extends Model {

        static associate(models) {
            // no association
        }

    }

    Tag.init(
        {

            tag_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            tag_name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },

            tag_color: {
                type: DataTypes.STRING(10),
                allowNull: false,
                defaultValue: '#000000',
                comment: 'Hex color',
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

            modelName: 'tag',

            tableName: table('tag'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',

            underscored: true,
        }
    );

    return Tag;
};