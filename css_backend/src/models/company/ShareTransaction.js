'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {
    class ShareTransaction extends Model {
        static associate(models) {
            ShareTransaction.belongsTo(models.shares,             { foreignKey: 'share_id',                       as: 'share_header' });
            ShareTransaction.belongsTo(models.entity_shares,      { foreignKey: 'company_share_id',               as: 'company_share' });
            ShareTransaction.belongsTo(models.entities,           { foreignKey: 'entity_id',                      as: 'entity' });
            ShareTransaction.belongsTo(models.entities,           { foreignKey: 'official_entity_id',             as: 'official_entity' });
            ShareTransaction.belongsTo(models.entities,           { foreignKey: 'transferee_official_entity_id',  as: 'transferee_entity' });
            ShareTransaction.belongsTo(models.entities,           { foreignKey: 'transferor_official_entity_id',  as: 'transferor_entity' });
            ShareTransaction.belongsTo(models.share_class_master, { foreignKey: 'share_class_id',                 as: 'share_class' });
        }
    }

    ShareTransaction.init({
        share_transaction_id: {
            type:          DataTypes.BIGINT.UNSIGNED,
            primaryKey:    true,
            autoIncrement: true,
        },

        // ── IDENTITY ────────────────────────────────────────────────────────
        share_id:         { type: DataTypes.BIGINT.UNSIGNED,  allowNull: true,  defaultValue: null },
        share_set_id:     { type: DataTypes.STRING(100),      allowNull: false },
        company_share_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        entity_id:        { type: DataTypes.BIGINT.UNSIGNED,  allowNull: false },

        // ── SHAREHOLDER ─────────────────────────────────────────────────────
        official_type: {
            type:      DataTypes.ENUM('INDIVIDUAL', 'CORPORATE', 'JOINT', 'SUBFUND', 'TRUST', 'NOMINEE'),
            allowNull: false,
        },
        official_entity_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },

        // ── SHARE DETAILS ────────────────────────────────────────────────────
        currency:       { type: DataTypes.STRING(10),       allowNull: false },
        share_class_id: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
        share_type: {
            type:         DataTypes.ENUM('NORMAL', 'BONUS', 'GUARANTEE'),
            allowNull:    false,
            defaultValue: 'NORMAL',
        },
        transaction_status: {
            type:      DataTypes.ENUM('IN', 'OUT', 'NONE'),
            allowNull: false,
        },
        transaction_no: { type: DataTypes.STRING(100), allowNull: true, defaultValue: null },
        folio_no:       { type: DataTypes.STRING(100), allowNull: true, defaultValue: null },
        share_cert_no:  { type: DataTypes.STRING(100), allowNull: true, defaultValue: null },

        // ── AMOUNTS ──────────────────────────────────────────────────────────
        no_of_shares:         { type: DataTypes.DECIMAL(28, 6), allowNull: false, defaultValue: 0 },
        issued_share_capital: { type: DataTypes.DECIMAL(28, 6), allowNull: false, defaultValue: 0 },
        paidup_share_capital: { type: DataTypes.DECIMAL(28, 6), allowNull: false, defaultValue: 0 },
        unpaid_share_capital: { type: DataTypes.DECIMAL(28, 6), allowNull: false, defaultValue: 0 },
        per_share:            { type: DataTypes.DECIMAL(18, 8), allowNull: false, defaultValue: 0 },
        issued_per_share:     { type: DataTypes.DECIMAL(18, 8), allowNull: false, defaultValue: 0 },

        // ── PARTIAL PAYMENT ──────────────────────────────────────────────────
        is_partially_paid:        { type: DataTypes.TINYINT(1),       allowNull: false, defaultValue: 0 },
        partial_payment_no_times: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true,  defaultValue: null },

        // ── PREV / REPLACED ──────────────────────────────────────────────────
        combine_share_id:  { type: DataTypes.BIGINT.UNSIGNED,   allowNull: true, defaultValue: null },
        old_share_id:      { type: DataTypes.BIGINT.UNSIGNED,   allowNull: true, defaultValue: null },
        old_share_class_id:{ type: DataTypes.SMALLINT.UNSIGNED, allowNull: true, defaultValue: null },
        old_currency:      { type: DataTypes.STRING(10),        allowNull: true, defaultValue: null },
        old_share_cert_no: { type: DataTypes.STRING(100),       allowNull: true, defaultValue: null },

        // ── TRANSFEREE ───────────────────────────────────────────────────────
        transferee_official_entity_id:   { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, defaultValue: null },
        transferee_share_transaction_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, defaultValue: null },
        transferee_no_of_shares:         { type: DataTypes.DECIMAL(28, 6),  allowNull: true, defaultValue: null },
        transferee_issued_capital:       { type: DataTypes.DECIMAL(28, 6),  allowNull: true, defaultValue: null },
        transferee_paidup_capital:       { type: DataTypes.DECIMAL(28, 6),  allowNull: true, defaultValue: null },

        // ── TRANSFEROR ───────────────────────────────────────────────────────
        transferor_official_entity_id:   { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, defaultValue: null },
        transferor_share_transaction_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, defaultValue: null },
        transferor_no_of_shares:         { type: DataTypes.DECIMAL(28, 6),  allowNull: true, defaultValue: null },
        transferor_issued_capital:       { type: DataTypes.DECIMAL(28, 6),  allowNull: true, defaultValue: null },
        transferor_paidup_capital:       { type: DataTypes.DECIMAL(28, 6),  allowNull: true, defaultValue: null },

        // ── CONSIDERATION ────────────────────────────────────────────────────
        cash:                        { type: DataTypes.DECIMAL(28, 6), allowNull: true,  defaultValue: null },
        otherwise_cash:              { type: DataTypes.DECIMAL(28, 6), allowNull: true,  defaultValue: null },
        no_consideration:            { type: DataTypes.TINYINT(1),     allowNull: false, defaultValue: 0 },
        transactional_consideration: { type: DataTypes.DECIMAL(28, 6), allowNull: true,  defaultValue: null },

        // ── FLAGS ────────────────────────────────────────────────────────────
        is_amalg_or_merge: { type: DataTypes.TINYINT(1), allowNull: false, defaultValue: 0 },
        is_retain:         { type: DataTypes.TINYINT(1), allowNull: false, defaultValue: 0 },
        is_acra:           { type: DataTypes.TINYINT(1), allowNull: false, defaultValue: 0 },
        is_vote:           { type: DataTypes.TINYINT(1), allowNull: false, defaultValue: 0 },
        is_workflow:       { type: DataTypes.TINYINT(1), allowNull: false, defaultValue: 0 },
        is_discrepancy:    { type: DataTypes.TINYINT(1), allowNull: false, defaultValue: 0 },
        is_ubo:            { type: DataTypes.TINYINT(1), allowNull: false, defaultValue: 0 },
        no_of_ubo:         { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },

        // ── DATA SOURCE ──────────────────────────────────────────────────────
        old_data: { type: DataTypes.JSON, allowNull: true, defaultValue: null },
        data_from: {
            type:         DataTypes.ENUM('MANUAL', 'DM', 'BIZINSITE', 'WORKFLOW', 'API', 'OPENING'),
            allowNull:    false,
            defaultValue: 'MANUAL',
        },
        share_workflow_status: { type: DataTypes.STRING(50), allowNull: true, defaultValue: null },

        // ── STAMP DUTY ───────────────────────────────────────────────────────
        stamp_duty_payment:        { type: DataTypes.TINYINT(1),     allowNull: false, defaultValue: 0 },
        stamp_duty_payment_date:   { type: DataTypes.DATEONLY,       allowNull: true,  defaultValue: null },
        stamp_duty_payment_amount: { type: DataTypes.DECIMAL(28, 6), allowNull: true,  defaultValue: null },

        // ── STATUS & AUDIT ───────────────────────────────────────────────────
        status: {
            type:         DataTypes.ENUM('DRAFT', 'VALID', 'INVALID', 'CANCELLED'),
            allowNull:    false,
            defaultValue: 'DRAFT',
        },
        is_confirm:  { type: DataTypes.TINYINT(1),       allowNull: false, defaultValue: 0 },
        is_deleted:  { type: DataTypes.TINYINT(1),       allowNull: false, defaultValue: 0 },
        created_by:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: true,  defaultValue: null },
        updated_by:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: true,  defaultValue: null },
    }, {
        sequelize,
        modelName:   'share_transactions',
        tableName:   table('share_transactions'),
        timestamps:  true,
        createdAt:   'created_at',
        updatedAt:   'updated_at',
        underscored: true,
    });

    return ShareTransaction;
};
