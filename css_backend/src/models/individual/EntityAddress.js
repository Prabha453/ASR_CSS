'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class EntityAddress extends Model {

        static associate(models) {
            EntityAddress.belongsTo(models.entities, {
                foreignKey: 'entity_id',
                as: 'entity',
            });
        }

    }

    EntityAddress.init(
        {
            address_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            entity_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            entity_type: {
                type: DataTypes.ENUM('COMPANY', 'INDIVIDUAL'),
                allowNull: false,
            },
            address_type: {
                type: DataTypes.ENUM('CONTACT', 'RESIDENTIAL', 'FOREIGN', 'REGISTERED', 'BUSINESS', 'MAILING', 'OTHER'),
                allowNull: false,
                defaultValue: 'CONTACT',
            },
            block_no: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            street_name: {
                type: DataTypes.STRING(200),
                allowNull: true,
            },
            building_name: {
                type: DataTypes.STRING(200),
                allowNull: true,
            },
            level_no: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            unit_no: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            city: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            state: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            postal_code: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            country: {
                type: DataTypes.STRING(100),
                allowNull: false,
                defaultValue: 'Singapore',
            },
            country_code: {
                type: DataTypes.CHAR(3),
                allowNull: true,
            },
            region_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                allowNull: true,
            },
            proof_of_address_url: {
                type: DataTypes.STRING(500),
                allowNull: true,
            },
            proof_of_address_name: {
                type: DataTypes.STRING(200),
                allowNull: true,
            },
            is_primary: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            effective_from: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            effective_to: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            is_deleted: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            created_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            created_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
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
            modelName: 'entity_address',
            tableName: table('entity_address'),
            timestamps: false,
            createdAt: false,
            updatedAt: 'updated_date',
            underscored: true,
            indexes: [
                { fields: ['entity_id'],    name: 'idx_address_entity' },
                { fields: ['address_type'], name: 'idx_address_type' },
                { fields: ['is_deleted'],   name: 'idx_address_deleted' },
            ],
        }
    );

    return EntityAddress;
};
