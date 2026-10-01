'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {
    class ShareDistinctive extends Model {
        static associate(models) {
            ShareDistinctive.belongsTo(models.shares,             { foreignKey: 'share_id',            as: 'share_header' });
            ShareDistinctive.belongsTo(models.share_transactions, { foreignKey: 'share_transaction_id', as: 'transaction' });
        }
    }

    ShareDistinctive.init({
        id:                   { type: DataTypes.BIGINT.UNSIGNED,  primaryKey: true, autoIncrement: true },
        entity_id:            { type: DataTypes.BIGINT.UNSIGNED,  allowNull: false },
        share_transaction_id: { type: DataTypes.BIGINT.UNSIGNED,  allowNull: false },
        share_set_id:         { type: DataTypes.STRING(100),      allowNull: false },
        share_cert_no:        { type: DataTypes.STRING(100),      allowNull: true,  defaultValue: null },
        distinctive_from:     { type: DataTypes.STRING(100),      allowNull: true,  defaultValue: null },
        distinctive_to:       { type: DataTypes.STRING(100),      allowNull: true,  defaultValue: null },
        no_of_shares:         { type: DataTypes.DECIMAL(28, 6),   allowNull: false, defaultValue: 0 },
        is_deleted:           { type: DataTypes.TINYINT(1),       allowNull: false, defaultValue: 0 },
        created_by:           { type: DataTypes.INTEGER.UNSIGNED, allowNull: true,  defaultValue: null },
        updated_by:           { type: DataTypes.INTEGER.UNSIGNED, allowNull: true,  defaultValue: null },
    }, {
        sequelize,
        modelName:   'share_distinctive',
        tableName:   table('share_distinctive'),
        timestamps:  true,
        createdAt:   'created_at',
        updatedAt:   'updated_at',
        underscored: true,
    });

    return ShareDistinctive;
};
