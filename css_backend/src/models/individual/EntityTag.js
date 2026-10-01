'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class EntityTag extends Model {

        static associate(models) {
            EntityTag.belongsTo(models.entities, {
                foreignKey: 'entity_id',
                as: 'entity',
            });
            EntityTag.belongsTo(models.tag, {
                foreignKey: 'tag_id',
                as: 'tag_info',
            });
        }

    }

    EntityTag.init(
        {
            entity_tag_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            entity_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            tag_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            created_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            created_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'entity_tags',
            tableName: table('entity_tags'),
            timestamps: false,
            createdAt: false,
            updatedAt: false,
            underscored: true,
            indexes: [
                { fields: ['entity_id'], name: 'idx_etag_entity' },
                { fields: ['tag_id'],    name: 'idx_etag_tag' },
            ],
        }
    );

    return EntityTag;
};
