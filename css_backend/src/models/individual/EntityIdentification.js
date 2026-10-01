'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class EntityIdentification extends Model {

        static associate(models) {
            EntityIdentification.belongsTo(models.entities, {
                foreignKey: 'entity_id',
                as: 'entity',
            });
            EntityIdentification.belongsTo(models.member_id_type, {
                foreignKey: 'm_identification_id',
                as: 'id_type',
            });
        }

    }

    EntityIdentification.init(
        {
            identification_id: {
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
            m_identification_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                allowNull: true,
            },
            id_number: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            uen_no: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            fbrn_reg_no: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            uf_no: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            domes_bus_no: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            acra_no: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            id_issued_country: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            id_issued_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            id_expired_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            document_url: {
                type: DataTypes.STRING(500),
                allowNull: true,
            },
            document_name: {
                type: DataTypes.STRING(200),
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
            modelName: 'entity_identification',
            tableName: table('entity_identification'),
            timestamps: false,
            createdAt: false,
            updatedAt: 'updated_date',
            underscored: true,
            indexes: [
                { fields: ['entity_id'],  name: 'idx_ident_entity' },
                { fields: ['is_deleted'], name: 'idx_ident_deleted' },
            ],
        }
    );

    return EntityIdentification;
};
