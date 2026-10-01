'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class EntityFieldChangeHistory extends Model {

        static associate(models) {

        }

    }

    EntityFieldChangeHistory.init(
        {

            change_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            entity_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
            },

            field_key: {
                type: DataTypes.STRING(60),
                allowNull: false,
            },

            field_type_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
            },

            ref_id : {
                    type: DataTypes.INTEGER.UNSIGNED,
                    allowNull: true,
            },

            identification_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
            },

            old_value: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            new_value: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            effective_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },

            proposed_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },

            is_proposed: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            cron_status: {
                type: DataTypes.TINYINT.UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                comment: '0 = Pending, 1 = Applied',
            },

            changed_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },

            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },

            updated_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },

        },
        {
            sequelize,

            modelName: 'entity_field_change_history',

            tableName: table('entity_field_change_history'),

            timestamps: true,

            createdAt: 'created_at',

            updatedAt: 'updated_at',

            underscored: true,
        }
    );

    return EntityFieldChangeHistory;

};