'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class Jurisdiction extends Model {
        static associate(models) {
            Jurisdiction.belongsTo(models.countries, {
                foreignKey: 'country_id',
                as: 'country',
            });

            Jurisdiction.belongsTo(models.jurisdiction, {
                foreignKey: 'parent_jurisdiction_id',
                as: 'parent',
            });
        }
    }

    Jurisdiction.init(
        {
            jurisdiction_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            country_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                allowNull: false,
            },
            parent_jurisdiction_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            level: {
                type: DataTypes.ENUM('COUNTRY_NATIONAL', 'STATE_PROVINCE', 'FREE_ZONE', 'MUNICIPALITY'),
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },
            code: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
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
            modelName: 'jurisdiction',
            tableName: table('jurisdictions'),
            timestamps: false,
            underscored: true,
            indexes: [
                { fields: ['country_id'], name: 'idx_juris_country_id' },
                { fields: ['parent_jurisdiction_id'], name: 'idx_juris_parent_id' },
            ],
        }
    );

    return Jurisdiction;
};
