'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {
    class SharePayment extends Model {
        static associate(models) {
            SharePayment.belongsTo(models.share_transactions, { foreignKey: 'share_transaction_id', as: 'transaction' });
        }
    }

    SharePayment.init({
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
        entity_id:            { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        share_transaction_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        share_set_id:         { type: DataTypes.STRING(100),     allowNull: false },
        payment_type: {
            type:      DataTypes.ENUM('CASH', 'OTHERWISE_THAN_CASH', 'NO_CONSIDERATION'),
            allowNull: false,
        },
        cash:                     { type: DataTypes.DECIMAL(28, 6), allowNull: true,  defaultValue: null },
        otherwise_cash:           { type: DataTypes.DECIMAL(28, 6), allowNull: true,  defaultValue: null },
        no_consideration:         { type: DataTypes.TINYINT(1),     allowNull: false, defaultValue: 0 },
        consideration_description:{ type: DataTypes.TEXT,           allowNull: true,  defaultValue: null },
        payment_date:             { type: DataTypes.DATEONLY,       allowNull: true,  defaultValue: null },
        is_deleted:               { type: DataTypes.TINYINT(1),     allowNull: false, defaultValue: 0 },
        created_by:               { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
        updated_by:               { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
    }, {
        sequelize,
        modelName:   'share_payments',
        tableName:   table('share_payments'),
        timestamps:  true,
        createdAt:   'created_at',
        updatedAt:   'updated_at',
        underscored: true,
    });

    return SharePayment;
};
