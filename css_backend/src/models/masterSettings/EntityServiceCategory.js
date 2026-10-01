'use strict';

const { Model } = require('sequelize');

const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class EntityServiceCategory extends Model {

        static associate(models) {
         EntityServiceCategory.hasMany(
            models.product_and_service,
            {
                foreignKey: 'category_id',
                sourceKey: 'service_id',
                as: 'products',
            }
    );
        }

    }

    EntityServiceCategory.init(
        {

            service_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            service_name: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },

            service_description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            service_image: {
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

            modelName: 'entity_service_category',

            tableName: table('entity_service_category'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',

            underscored: true,

            indexes: [
                {
                    fields: ['is_deleted'],
                    name: 'idx_service_category_deleted',
                },
            ],
        }
    );

    return EntityServiceCategory;

};