'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class AddressHistory extends Model {

        static associate(models) {

            // association here if needed

        }

    }

    AddressHistory.init(
        {
            addr_history_id: {
                type:          DataTypes.INTEGER.UNSIGNED,
                primaryKey:    true,
                autoIncrement: true,
                allowNull:     false,
            },
            type: {
                type:         DataTypes.INTEGER,
                allowNull:    false,
                defaultValue: 0,
                comment:      '0 - Company, 1 - Individual',
            },
            ref_id: {
                type:      DataTypes.INTEGER,
                allowNull: false,
            },
            category: {
                type:      DataTypes.STRING(100),
                allowNull: false,
            },
            // 0 = Proposed, 1 = Effective  ← note: opposite of old table
            proposed_or_effective: {
                type:         DataTypes.TINYINT(1),
                allowNull:    false,
                defaultValue: 0,
            },
            proposed_date: {
                type:      DataTypes.STRING(20),
                allowNull: false,
                defaultValue: '',
            },
            effective_date: {
                type:      DataTypes.STRING(20),
                allowNull: true,
            },
            old_details: {
                type:      DataTypes.TEXT,
                allowNull: false,
            },
            new_details: {
                type:      DataTypes.TEXT,
                allowNull: false,
            },
            changed_by: {
                type:      DataTypes.INTEGER,
                allowNull: false,
            },
            changed_created_date: {
                type:         DataTypes.DATE,
                allowNull:    false,
                defaultValue: DataTypes.NOW,
            },
            cron_status: {
                type:         DataTypes.INTEGER,
                allowNull:    false,
                defaultValue: 0,
                comment:      '0 - Not Updated, 1 - Updated',
            },
        },
        {
            sequelize,

            modelName: 'address_history',

            tableName: table('address_history'),

            timestamps: false,

            underscored: true,
        }
    );

    return AddressHistory;

};