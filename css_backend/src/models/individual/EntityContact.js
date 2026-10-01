'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class EntityContact extends Model {

        static associate(models) {
            EntityContact.belongsTo(models.entities, {
                foreignKey: 'entity_id',
                as: 'entity',
            });
        }

    }

    EntityContact.init(
        {
            contact_id: {
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
            contact_type: {
                type: DataTypes.ENUM('OFFICE', 'MOBILE', 'FAX', 'HOME', 'EMAIL', 'OTHER'),
                allowNull: false,
                defaultValue: 'OFFICE',
            },
            phone_country_code: {
                type: DataTypes.STRING(10),
                allowNull: true,
                defaultValue: '+65',
            },
            contact_value: {
                type: DataTypes.STRING(500),
                allowNull: true,
            },
            is_primary: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
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
            modelName: 'entity_contact',
            tableName: table('entity_contact'),
            timestamps: false,
            createdAt: false,
            updatedAt: 'updated_date',
            underscored: true,
            indexes: [
                { fields: ['entity_id'],    name: 'idx_contact_entity' },
                { fields: ['contact_type'], name: 'idx_contact_type' },
                { fields: ['is_deleted'],   name: 'idx_contact_deleted' },
            ],
        }
    );

    return EntityContact;
};
