'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {
    class Share extends Model {
        static associate(models) {
            Share.belongsTo(models.entities,          { foreignKey: 'entity_id',          as: 'entity' });
            Share.belongsTo(models.transaction_type,  { foreignKey: 'transaction_type_id', as: 'transaction_type' });
            Share.hasMany(models.share_transactions,  { foreignKey: 'share_id',            as: 'transactions' });
        }
    }

    Share.init({
        share_id: {
            type:          DataTypes.BIGINT.UNSIGNED,
            primaryKey:    true,
            autoIncrement: true,
        },
        entity_id:                 { type: DataTypes.BIGINT.UNSIGNED,  allowNull: false },
        transaction_type_id:       { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
        extra_type_of_transaction: { type: DataTypes.STRING(100),       allowNull: true,  defaultValue: null },
        transaction_date:          { type: DataTypes.DATEONLY,          allowNull: false },
        status: {
            type:         DataTypes.ENUM('DRAFT', 'CONFIRMED', 'VALID', 'INVALID', 'CANCELLED'),
            allowNull:    false,
            defaultValue: 'DRAFT',
        },
        source_from: {
            type:         DataTypes.ENUM('MANUAL', 'DM', 'BIZINSITE', 'WORKFLOW', 'API', 'OPENING'),
            allowNull:    false,
            defaultValue: 'MANUAL',
        },
        workflow_id:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
        workflow_status: { type: DataTypes.STRING(50),       allowNull: true, defaultValue: null },
        is_workflow:     { type: DataTypes.TINYINT(1),       allowNull: false, defaultValue: 0 },
        is_acra:         { type: DataTypes.TINYINT(1),       allowNull: false, defaultValue: 0 },
        is_discrepancy:  { type: DataTypes.TINYINT(1),       allowNull: false, defaultValue: 0 },
        remarks:         { type: DataTypes.TEXT,             allowNull: true, defaultValue: null },
        is_deleted:      { type: DataTypes.TINYINT(1),       allowNull: false, defaultValue: 0 },
        share_set_id:    { type: DataTypes.STRING(100),      allowNull: false, unique: true },
        created_by:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
        updated_by:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
    }, {
        sequelize,
        modelName: 'shares',
        tableName: table('shares'),
        timestamps: true,
        createdAt:  'created_at',
        updatedAt:  'updated_at',
        underscored: true,
    });

    return Share;
};
