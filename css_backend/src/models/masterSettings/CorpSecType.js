'use strict';

const { Model } = require('sequelize');

const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class CorpSecType extends Model {

        static associate(models) {

            CorpSecType.belongsTo(models.corp_sec_type, {
                foreignKey: 'corp_sec_parent',
                as: 'parent',
            });

        }

    }

    CorpSecType.init(
        {

            corp_sec_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            corp_sec_parent: {
                type: DataTypes.SMALLINT.UNSIGNED,
                allowNull: true,
            },

            corp_sec_name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },

            files: {
                type: DataTypes.STRING(500),
                allowNull: true,
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

            modelName: 'corp_sec_type',

            tableName: table('corp_sec_type'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',

            underscored: true,

            indexes: [
                {
                    fields: ['corp_sec_parent'],
                    name: 'idx_corp_sec_parent',
                },
                {
                    fields: ['is_deleted'],
                    name: 'idx_corp_sec_deleted',
                },
            ],
        }
    );

    return CorpSecType;

};