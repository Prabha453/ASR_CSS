'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class TransactionType extends Model {

        static associate(models) {
            // no association
        }

    }

    TransactionType.init(
        {

            t_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            t_type: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },

            t_name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },

            t_order: {
                type: DataTypes.SMALLINT.UNSIGNED,
                allowNull: false,
                defaultValue: 0,
            },

            t_type_no: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },

            t_type_color: {
                type: DataTypes.STRING(20),
                allowNull: true,
                defaultValue: "#30a16c"
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

            modelName: 'transaction_type',

            tableName: table('transaction_type'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',

            underscored: true,

            indexes: [
                {
                    fields: ['t_type'],
                    name: 'idx_transaction_type',
                },
                {
                    fields: ['is_deleted'],
                    name: 'idx_transaction_deleted',
                },
            ],
        }
    );

    return TransactionType;
};