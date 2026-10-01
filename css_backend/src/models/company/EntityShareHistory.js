'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class EntityShareHistory extends Model {

        static associate(models) {
            EntityShareHistory.belongsTo(models.entity_shares, {
                foreignKey: 'entity_shares_id',
                as: 'share',
            });
            EntityShareHistory.belongsTo(models.share_class_master, {
                foreignKey: 'share_class_id',
                as: 'share_class',
            });
        }

    }

    EntityShareHistory.init(
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            entity_shares_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
            },
            entity_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
            },
            transaction_type: {
                type: DataTypes.STRING(100),
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
            delta_shares: {
                type: DataTypes.DOUBLE,
                allowNull: true,
                defaultValue: null,
            },
            delta_authorized_capital: {
                type: DataTypes.DOUBLE,
                allowNull: true,
                defaultValue: null,
            },
            delta_issued_capital: {
                type: DataTypes.DOUBLE,
                allowNull: true,
                defaultValue: null,
            },
            delta_paid_capital: {
                type: DataTypes.DOUBLE,
                allowNull: true,
                defaultValue: null,
            },
            delta_guarantee_amount: {
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
            share_set_id: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            remarks: {
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: null,
            },
            created_by: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                defaultValue: null,
            },
        },
        {
            sequelize,
            modelName: 'entity_share_history',
            tableName: table('entity_shares_history'),
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: false,
            underscored: true,
        }
    );

    return EntityShareHistory;
};
