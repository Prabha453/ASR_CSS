'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {
    class ShareLedger extends Model {
        static associate(models) {
            ShareLedger.belongsTo(models.shares,             { foreignKey: 'share_id',            as: 'share_header' });
            ShareLedger.belongsTo(models.share_transactions, { foreignKey: 'share_transaction_id', as: 'transaction' });
            ShareLedger.belongsTo(models.entity_shares,      { foreignKey: 'company_share_id',     as: 'company_share' });
        }
    }

    ShareLedger.init({
        id:                   { type: DataTypes.BIGINT.UNSIGNED,  primaryKey: true, autoIncrement: true },
        entity_id:            { type: DataTypes.BIGINT.UNSIGNED,  allowNull: false },
        share_id:             { type: DataTypes.BIGINT.UNSIGNED,  allowNull: true,  defaultValue: null },
        share_transaction_id: { type: DataTypes.BIGINT.UNSIGNED,  allowNull: true,  defaultValue: null },
        company_share_id:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: true,  defaultValue: null },
        share_set_id:         { type: DataTypes.STRING(100),      allowNull: false },

        ledger_scope: {
            type:      DataTypes.ENUM('COMPANY', 'SHAREHOLDER'),
            allowNull: false,
        },
        official_type: {
            type:         DataTypes.ENUM('INDIVIDUAL', 'CORPORATE', 'JOINT', 'SUBFUND', 'TRUST', 'NOMINEE'),
            allowNull:    true,
            defaultValue: null,
        },
        official_entity_id:  { type: DataTypes.BIGINT.UNSIGNED,  allowNull: true,  defaultValue: null },
        transaction_type_id: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
        transaction_status: {
            type:      DataTypes.ENUM('IN', 'OUT', 'NONE'),
            allowNull: false,
        },
        action_type: {
            type:      DataTypes.ENUM('ADD', 'REMOVE', 'REPLACE', 'ADJUST', 'INFO'),
            allowNull: false,
        },
        transaction_date: { type: DataTypes.DATEONLY,       allowNull: false },
        transaction_no:   { type: DataTypes.STRING(100),    allowNull: true, defaultValue: null },
        posting_order:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
        currency:         { type: DataTypes.STRING(10),     allowNull: false },
        share_class_id:   { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
        share_type: {
            type:         DataTypes.ENUM('NORMAL', 'BONUS', 'GUARANTEE'),
            allowNull:    false,
            defaultValue: 'NORMAL',
        },
        folio_no:          { type: DataTypes.STRING(100), allowNull: true, defaultValue: null },
        share_cert_no:     { type: DataTypes.STRING(100), allowNull: true, defaultValue: null },
        old_share_cert_no: { type: DataTypes.STRING(100), allowNull: true, defaultValue: null },

        distinctive_from:     { type: DataTypes.STRING(100), allowNull: true, defaultValue: null },
        distinctive_to:       { type: DataTypes.STRING(100), allowNull: true, defaultValue: null },
        old_distinctive_from: { type: DataTypes.STRING(100), allowNull: true, defaultValue: null },
        old_distinctive_to:   { type: DataTypes.STRING(100), allowNull: true, defaultValue: null },

        // ── MOVEMENT ──────────────────────────────────────────────────────────
        qty_in:               { type: DataTypes.DECIMAL(28, 6), allowNull: false, defaultValue: 0 },
        qty_out:              { type: DataTypes.DECIMAL(28, 6), allowNull: false, defaultValue: 0 },
        issued_capital_in:    { type: DataTypes.DECIMAL(28, 6), allowNull: false, defaultValue: 0 },
        issued_capital_out:   { type: DataTypes.DECIMAL(28, 6), allowNull: false, defaultValue: 0 },
        paidup_capital_in:    { type: DataTypes.DECIMAL(28, 6), allowNull: false, defaultValue: 0 },
        paidup_capital_out:   { type: DataTypes.DECIMAL(28, 6), allowNull: false, defaultValue: 0 },
        unpaid_capital_in:    { type: DataTypes.DECIMAL(28, 6), allowNull: false, defaultValue: 0 },
        unpaid_capital_out:   { type: DataTypes.DECIMAL(28, 6), allowNull: false, defaultValue: 0 },
        guarantee_amount_in:  { type: DataTypes.DECIMAL(28, 6), allowNull: false, defaultValue: 0 },
        guarantee_amount_out: { type: DataTypes.DECIMAL(28, 6), allowNull: false, defaultValue: 0 },

        // ── RUNNING BALANCES ──────────────────────────────────────────────────
        balance_before_qty:            { type: DataTypes.DECIMAL(28, 6), allowNull: false, defaultValue: 0 },
        balance_after_qty:             { type: DataTypes.DECIMAL(28, 6), allowNull: false, defaultValue: 0 },
        balance_before_issued_capital: { type: DataTypes.DECIMAL(28, 6), allowNull: false, defaultValue: 0 },
        balance_after_issued_capital:  { type: DataTypes.DECIMAL(28, 6), allowNull: false, defaultValue: 0 },
        balance_before_paidup_capital: { type: DataTypes.DECIMAL(28, 6), allowNull: false, defaultValue: 0 },
        balance_after_paidup_capital:  { type: DataTypes.DECIMAL(28, 6), allowNull: false, defaultValue: 0 },
        balance_before_unpaid_capital: { type: DataTypes.DECIMAL(28, 6), allowNull: false, defaultValue: 0 },
        balance_after_unpaid_capital:  { type: DataTypes.DECIMAL(28, 6), allowNull: false, defaultValue: 0 },

        // ── CONSIDERATION ─────────────────────────────────────────────────────
        consideration_cash:           { type: DataTypes.DECIMAL(28, 6), allowNull: true, defaultValue: null },
        consideration_otherwise_cash: { type: DataTypes.DECIMAL(28, 6), allowNull: true, defaultValue: null },
        no_consideration:             { type: DataTypes.TINYINT(1),     allowNull: false, defaultValue: 0 },
        transactional_consideration:  { type: DataTypes.DECIMAL(28, 6), allowNull: true, defaultValue: null },

        // ── STATUS & FLAGS ────────────────────────────────────────────────────
        status: {
            type:         DataTypes.ENUM('DRAFT', 'VALID', 'INVALID', 'CANCELLED'),
            allowNull:    false,
            defaultValue: 'VALID',
        },
        source_from: {
            type:         DataTypes.ENUM('MANUAL', 'DM', 'BIZINSITE', 'WORKFLOW', 'API', 'OPENING'),
            allowNull:    false,
            defaultValue: 'MANUAL',
        },
        workflow_id:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: true,  defaultValue: null },
        workflow_status: { type: DataTypes.STRING(50),       allowNull: true,  defaultValue: null },
        is_acra:         { type: DataTypes.TINYINT(1),       allowNull: false, defaultValue: 0 },
        is_vote:         { type: DataTypes.TINYINT(1),       allowNull: false, defaultValue: 0 },
        is_retain:       { type: DataTypes.TINYINT(1),       allowNull: false, defaultValue: 0 },
        is_discrepancy:  { type: DataTypes.TINYINT(1),       allowNull: false, defaultValue: 0 },
        remarks:         { type: DataTypes.TEXT,             allowNull: true,  defaultValue: null },
        is_deleted:      { type: DataTypes.TINYINT(1),       allowNull: false, defaultValue: 0 },
        created_by:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: true,  defaultValue: null },
        updated_by:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: true,  defaultValue: null },
    }, {
        sequelize,
        modelName:   'share_ledger',
        tableName:   table('share_ledger'),
        timestamps:  true,
        createdAt:   'created_at',
        updatedAt:   'updated_at',
        underscored: true,
    });

    return ShareLedger;
};
