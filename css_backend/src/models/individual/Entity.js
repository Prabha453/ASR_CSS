'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class Entity extends Model {

        static associate(models) {
            Entity.hasOne(models.entity_individual_details, {
                foreignKey: 'entity_id',
                as: 'individual_detail',
            });
            Entity.hasOne(models.entity_company_details, {
                foreignKey: 'entity_id',
                as: 'company_detail',
            });
            Entity.belongsTo(models.company_type, {
                foreignKey: 'company_type_id',
                targetKey: 'company_type_id',
                as: 'company_type',
            });
            Entity.hasMany(models.entity_identification, {
                foreignKey: 'entity_id',
                as: 'identifications',
            });
            Entity.hasMany(models.entity_address, {
                foreignKey: 'entity_id',
                as: 'addresses',
            });
            Entity.hasMany(models.entity_contact, {
                foreignKey: 'entity_id',
                as: 'contacts',
            });
            Entity.hasMany(models.entity_tags, {
                foreignKey: 'entity_id',
                as: 'tags',
            });
            Entity.hasMany(models.entity_relationships, {
                foreignKey: 'entity_id',
                as: 'relationships',
            });
            Entity.hasMany(models.company_event, {
                foreignKey: 'entity_id',
                as: 'events',
            });

            Entity.hasMany(models.official_company_contact, {
                foreignKey: 'official_entity_id',
                sourceKey: 'entity_id',
                as: 'official_company_contacts',
                constraints: false,
            });
        }

    }

    Entity.init(
        {
            entity_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            entity_type: {
                type: DataTypes.ENUM('COMPANY', 'INDIVIDUAL'),
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING(300),
                allowNull: false,
            },
            former_name: {
                type: DataTypes.STRING(300),
                allowNull: true,
            },
            client_no: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'PENDING'),
                allowNull: false,
                defaultValue: 'ACTIVE',
            },
            company_reg_type: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            company_type_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                allowNull: true,
            },
            company_status: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            remarks: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            additional_remarks: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            default_address_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            default_contact_id: {
                type: DataTypes.BIGINT.UNSIGNED,
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
            modelName: 'entities',
            tableName: table('entities'),
            timestamps: false,
            createdAt: false,
            updatedAt: 'updated_date',
            underscored: true,
            indexes: [
                { fields: ['entity_type'], name: 'idx_entity_type' },
                { fields: ['is_deleted'],  name: 'idx_entity_deleted' },
                { fields: ['status'],      name: 'idx_entity_status' },
                { fields: ['client_no'],   name: 'idx_entity_client_no' },
            ],
        }
    );

    return Entity;
};
