'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class Authority extends Model {
        static associate(models) {
            Authority.belongsTo(models.countries, {
                foreignKey: 'country_id',
                as: 'country',
            });

            Authority.belongsTo(models.jurisdiction, {
                foreignKey: 'jurisdiction_id',
                as: 'jurisdiction',
            });
        }
    }

    Authority.init(
        {
            authority_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },
            authority_type: {
                type: DataTypes.STRING(80),
                allowNull: true,
            },
            country_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                allowNull: true,
            },
            jurisdiction_id: {
                type: DataTypes.BIGINT.UNSIGNED,
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
            modelName: 'authority',
            tableName: table('authorities'),
            timestamps: false,
            underscored: true,
            indexes: [
                { fields: ['country_id'], name: 'idx_auth_country_id' },
                { fields: ['jurisdiction_id'], name: 'idx_auth_jurisdiction_id' },
            ],
        }
    );

    return Authority;
};
