'use strict';

const { Model } = require('sequelize');

const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class TypeOfFee extends Model {

        static associate(models) {
            // no association
        }

    }

    TypeOfFee.init(
        {

            fee_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            type_of_fee: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },

            currency: {
                type: DataTypes.CHAR(3),
                allowNull: false,
                defaultValue: 'SGD',
            },

            low_range: {
                type: DataTypes.DECIMAL(15, 2),
                allowNull: true,
            },

            high_range: {
                type: DataTypes.DECIMAL(15, 2),
                allowNull: true,
            },

            fee_amt: {
                type: DataTypes.DECIMAL(15, 2),
                allowNull: false,
                defaultValue: 0.00,
            },

            plus_minus: {
                type: DataTypes.TINYINT,
                allowNull: false,
                defaultValue: 0,
                comment: '1=add, -1=subtract',
            },

            category_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                allowNull: true,
            },

            description: {
                type: DataTypes.STRING(500),
                allowNull: true,
            },

            detailed_description: {
                type: DataTypes.TEXT,
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

            modelName: 'type_of_fee',

            tableName: table('type_of_fee'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',

            underscored: true,

            indexes: [
                {
                    fields: ['currency'],
                    name: 'idx_fee_currency',
                },
                {
                    fields: ['category_id'],
                    name: 'idx_fee_category',
                },
                {
                    fields: ['is_deleted'],
                    name: 'idx_fee_deleted',
                },
            ],
        }
    );

    return TypeOfFee;

};