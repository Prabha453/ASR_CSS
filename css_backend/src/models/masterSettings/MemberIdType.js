'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class MemberIdType extends Model {

        static associate(models) {
            // no association
        }

    }

    MemberIdType.init(
        {

            m_identification_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            id_name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },

            slug_name: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
            },

            country_code: {
                type: DataTypes.CHAR(3),
                allowNull: true,
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

            modelName: 'member_id_type',

            tableName: table('member_id_type'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',

            underscored: true,
        }
    );

    return MemberIdType;
};