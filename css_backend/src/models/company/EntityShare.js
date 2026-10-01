'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class EntityShare extends Model {

        static associate(models) {
            EntityShare.belongsTo(models.entities, {
                foreignKey: 'entity_id',
                as: 'entity',
            });
            EntityShare.belongsTo(models.share_class_master, {
                foreignKey: 'share_class_id',
                as: 'share_class',
            });
            EntityShare.hasMany(models.entity_share_history, {
                foreignKey: 'entity_shares_id',
                as: 'history',
            });
        }

    }

    EntityShare.init(
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            entity_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
            },
            currency: {
                type: DataTypes.STRING(10),
                allowNull: false,
            },
            share_class_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
            },
            share_type: {
                type: DataTypes.ENUM('NORMAL', 'BONUS', 'GUARANTEE'),
                allowNull: false,
                defaultValue: 'NORMAL',
            },
            number_of_shares: {
                type: DataTypes.DOUBLE,
                allowNull: false,
                defaultValue: 0,
            },
            authorized_share_capital: {
                type: DataTypes.DOUBLE,
                allowNull: false,
                defaultValue: 0,
            },
            issued_share_capital: {
                type: DataTypes.DOUBLE,
                allowNull: false,
                defaultValue: 0,
            },
            paid_up_capital: {
                type: DataTypes.DOUBLE,
                allowNull: false,
                defaultValue: 0,
            },
            per_share: {
                type: DataTypes.DOUBLE,
                allowNull: false,
                defaultValue: 0,
            },
            issued_per_share: {
                type: DataTypes.DOUBLE,
                allowNull: false,
                defaultValue: 0,
            },
            guarantee_amount: {
                type: DataTypes.DOUBLE,
                allowNull: true,
                defaultValue: null,
            },
            date_of_transaction: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            source_from: {
                type: DataTypes.ENUM('MANUAL', 'DM', 'BIZINSITE', 'WORKFLOW', 'API'),
                allowNull: false,
                defaultValue: 'MANUAL',
            },
            workflow_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                defaultValue: null,
            },
            workflow_status: {
                type: DataTypes.STRING(50),
                allowNull: true,
                defaultValue: null,
            },
            is_workflow: {
                type: DataTypes.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },
            is_acra: {
                type: DataTypes.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },
            is_vot: {
                type: DataTypes.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },
            is_deleted: {
                type: DataTypes.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },
            share_set_id: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
            },
            created_by: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                defaultValue: null,
            },
            updated_by: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                defaultValue: null,
            },
        },
        {
            sequelize,
            modelName: 'entity_shares',
            tableName: table('entity_shares'),
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            underscored: true,
        }
    );

    return EntityShare;
};
