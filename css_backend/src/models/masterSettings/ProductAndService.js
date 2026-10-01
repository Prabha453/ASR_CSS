'use strict';

const { Model } = require('sequelize');

const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class ProductAndService extends Model {

        static associate(models) {

            ProductAndService.belongsTo(
                models.entity_service_category,
                {
                    foreignKey: 'category_id',
                    targetKey: 'service_id',
                    as: 'categoryDetails',
                }
            );

        }

    }

    ProductAndService.init(
        {

            product_service_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            item_name: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },

            currency_code: {
                type: DataTypes.STRING(10),
                allowNull: false,
                defaultValue: 'SGD',
            },

            range_low: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },

            range_high: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },

            fee_amount: {
                type: DataTypes.DECIMAL(15, 2),
                allowNull: false,
                defaultValue: 0.00,
            },

            quantity: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                defaultValue: 1,
            },

            uom: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },

            status: {
                type: DataTypes.ENUM(
                    'ACTIVE',
                    'INACTIVE'
                ),
                allowNull: false,
                defaultValue: 'ACTIVE',
            },

            commission_type: {
                type: DataTypes.ENUM(
                    'FIXED',
                    'PERCENTAGE'
                ),
                allowNull: true,
            },

            commission_value: {
                type: DataTypes.DECIMAL(15, 2),
                allowNull: true,
            },

            service_type: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },

            category_id: {
                type: DataTypes.INTEGER.UNSIGNED,
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

            modelName: 'product_and_service',

            tableName: table('product_and_service'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',

            underscored: true,

            indexes: [
                {
                    fields: ['is_deleted'],
                    name: 'idx_product_service_deleted',
                },
                {
                    fields: ['status'],
                    name: 'idx_product_service_status',
                },
                {
                    fields: ['category_id'],
                    name: 'idx_product_service_category',
                },
            ],
        }
    );

    return ProductAndService;

};