'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class ShareClassMaster extends Model {

        static associate(models) {
            // no association
        }

    }

    ShareClassMaster.init(
        {

            sc_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            sc_name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },

            sc_slug: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
            },

            sc_type: {
                type: DataTypes.STRING(100),
                allowNull: false,
                defaultValue: ''
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

            modelName: 'share_class_master',

            tableName: table('share_class_master'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',

            underscored: true,

            indexes: [
                {
                    unique: true,
                    fields: ['sc_slug'],
                    name: 'uq_sc_slug',
                },
                {
                    fields: ['is_deleted'],
                    name: 'idx_sc_deleted',
                },
            ],
        }
    );

    return ShareClassMaster;
};