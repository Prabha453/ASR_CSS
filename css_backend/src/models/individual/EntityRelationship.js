'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class EntityRelationship extends Model {

        static associate(models) {
            EntityRelationship.belongsTo(models.entities, {
                foreignKey: 'entity_id',
                as: 'entity',
            });
        }

    }

    EntityRelationship.init(
        {
            relationship_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            entity_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            related_name: {
                type: DataTypes.STRING(300),
                allowNull: true,
            },
            related_entity_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            relationship_type: {
                type: DataTypes.ENUM('FATHER', 'MOTHER', 'SPOUSE', 'SIBLING', 'CHILD', 'OTHER'),
                allowNull: false,
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
            modelName: 'entity_relationships',
            tableName: table('entity_relationships'),
            timestamps: false,
            createdAt: false,
            updatedAt: 'updated_date',
            underscored: true,
            indexes: [
                { fields: ['entity_id'],        name: 'idx_rel_entity' },
                { fields: ['relationship_type'], name: 'idx_rel_type' },
                { fields: ['is_deleted'],        name: 'idx_rel_deleted' },
            ],
        }
    );

    return EntityRelationship;
};
