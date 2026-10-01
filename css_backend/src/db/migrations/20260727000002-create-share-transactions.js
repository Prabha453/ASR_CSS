'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('share_transactions'), {

            share_transaction_id: {
                type:          Sequelize.BIGINT.UNSIGNED,
                primaryKey:    true,
                autoIncrement: true,
                allowNull:     false,
            },

            share_id: {
                type:         Sequelize.BIGINT.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
                comment:      'FK → cs_shares.share_id (header); added in share-module-fks migration',
            },

            share_set_id: {
                type:      Sequelize.STRING(100),
                allowNull: false,
            },

            company_share_id: {
                type:      Sequelize.INTEGER.UNSIGNED,
                allowNull: false,
                comment:   'FK → cs_entity_shares.id',
            },

            entity_id: {
                type:      Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
            },

            official_type: {
                type:      Sequelize.ENUM('INDIVIDUAL', 'CORPORATE', 'JOINT', 'SUBFUND', 'TRUST', 'NOMINEE'),
                allowNull: false,
            },

            official_entity_id: {
                type:      Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                comment:   'Shareholder entity FK → cs_entities.entity_id',
            },

            currency: {
                type:      Sequelize.STRING(10),
                allowNull: false,
            },

            share_class_id: {
                type:      Sequelize.SMALLINT.UNSIGNED,
                allowNull: false,
            },

            share_type: {
                type:         Sequelize.ENUM('NORMAL', 'BONUS', 'GUARANTEE'),
                allowNull:    false,
                defaultValue: 'NORMAL',
            },

            transaction_status: {
                type:      Sequelize.ENUM('IN', 'OUT', 'NONE'),
                allowNull: false,
            },

            transaction_no: {
                type:         Sequelize.STRING(100),
                allowNull:    true,
                defaultValue: null,
            },

            folio_no: {
                type:         Sequelize.STRING(100),
                allowNull:    true,
                defaultValue: null,
            },

            share_cert_no: {
                type:         Sequelize.STRING(100),
                allowNull:    true,
                defaultValue: null,
            },

            no_of_shares: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
            },

            issued_share_capital: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
            },

            paidup_share_capital: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
            },

            unpaid_share_capital: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
            },

            per_share: {
                type:         Sequelize.DECIMAL(18, 8),
                allowNull:    false,
                defaultValue: 0,
            },

            issued_per_share: {
                type:         Sequelize.DECIMAL(18, 8),
                allowNull:    false,
                defaultValue: 0,
            },

            is_partially_paid: {
                type:         Sequelize.TINYINT(1),
                allowNull:    false,
                defaultValue: 0,
            },

            partial_payment_no_times: {
                type:         Sequelize.INTEGER.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
            },

            combine_share_id: {
                type:         Sequelize.BIGINT.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
                comment:      'Self-ref FK → cs_share_transactions.share_transaction_id',
            },

            old_share_id: {
                type:         Sequelize.BIGINT.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
                comment:      'Self-ref FK → cs_share_transactions.share_transaction_id',
            },

            old_share_class_id: {
                type:         Sequelize.SMALLINT.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
            },

            old_currency: {
                type:         Sequelize.STRING(10),
                allowNull:    true,
                defaultValue: null,
            },

            old_share_cert_no: {
                type:         Sequelize.STRING(100),
                allowNull:    true,
                defaultValue: null,
            },

            transferee_entity_id: {
                type:         Sequelize.BIGINT.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
            },

            transferee_share_id: {
                type:         Sequelize.BIGINT.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
                comment:      'Self-ref FK → cs_share_transactions.share_transaction_id',
            },

            transferee_no_of_shares: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    true,
                defaultValue: null,
            },

            transferee_issued_capital: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    true,
                defaultValue: null,
            },

            transferee_paidup_capital: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    true,
                defaultValue: null,
            },

            transferor_entity_id: {
                type:         Sequelize.BIGINT.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
            },

            transferor_share_id: {
                type:         Sequelize.BIGINT.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
                comment:      'Self-ref FK → cs_share_transactions.share_transaction_id',
            },

            transferor_no_of_shares: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    true,
                defaultValue: null,
            },

            transferor_issued_capital: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    true,
                defaultValue: null,
            },

            transferor_paidup_capital: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    true,
                defaultValue: null,
            },

            cash: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    true,
                defaultValue: null,
            },

            otherwise_cash: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    true,
                defaultValue: null,
            },

            no_consideration: {
                type:         Sequelize.TINYINT(1),
                allowNull:    false,
                defaultValue: 0,
            },

            transactional_consideration: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    true,
                defaultValue: null,
            },

            is_amalg_or_merge: {
                type:         Sequelize.TINYINT(1),
                allowNull:    false,
                defaultValue: 0,
            },

            is_retain: {
                type:         Sequelize.TINYINT(1),
                allowNull:    false,
                defaultValue: 0,
            },

            is_acra: {
                type:         Sequelize.TINYINT(1),
                allowNull:    false,
                defaultValue: 0,
            },

            is_vote: {
                type:         Sequelize.TINYINT(1),
                allowNull:    false,
                defaultValue: 0,
            },

            is_workflow: {
                type:         Sequelize.TINYINT(1),
                allowNull:    false,
                defaultValue: 0,
            },

            is_discrepancy: {
                type:         Sequelize.TINYINT(1),
                allowNull:    false,
                defaultValue: 0,
            },

            is_ubo: {
                type:         Sequelize.TINYINT(1),
                allowNull:    false,
                defaultValue: 0,
            },

            no_of_ubo: {
                type:         Sequelize.INTEGER.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
            },

            old_data: {
                type:         Sequelize.JSON,
                allowNull:    true,
                defaultValue: null,
            },

            data_from: {
                type:         Sequelize.ENUM('MANUAL', 'DM', 'BIZINSITE', 'WORKFLOW', 'API', 'OPENING'),
                allowNull:    false,
                defaultValue: 'MANUAL',
            },

            share_workflow_status: {
                type:         Sequelize.STRING(50),
                allowNull:    true,
                defaultValue: null,
            },

            stamp_duty_payment: {
                type:         Sequelize.TINYINT(1),
                allowNull:    false,
                defaultValue: 0,
            },

            stamp_duty_payment_date: {
                type:         Sequelize.DATEONLY,
                allowNull:    true,
                defaultValue: null,
            },

            stamp_duty_payment_amount: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    true,
                defaultValue: null,
            },

            status: {
                type:         Sequelize.ENUM('DRAFT', 'VALID', 'INVALID', 'CANCELLED'),
                allowNull:    false,
                defaultValue: 'DRAFT',
            },

            is_confirm: {
                type:         Sequelize.TINYINT(1),
                allowNull:    false,
                defaultValue: 0,
            },

            is_deleted: {
                type:         Sequelize.TINYINT(1),
                allowNull:    false,
                defaultValue: 0,
            },

            created_by: {
                type:         Sequelize.INTEGER.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
            },

            created_at: {
                type:         Sequelize.DATE,
                allowNull:    false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },

            updated_by: {
                type:         Sequelize.INTEGER.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
            },

            updated_at: {
                type:         Sequelize.DATE,
                allowNull:    false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
            },

        });

        await queryInterface.addIndex(table('share_transactions'), ['entity_id'],                                                       { name: 'idx_share_txn_entity' });
        await queryInterface.addIndex(table('share_transactions'), ['entity_id', 'official_entity_id'],                                 { name: 'idx_share_txn_holder' });
        await queryInterface.addIndex(table('share_transactions'), ['entity_id', 'official_entity_id', 'share_class_id', 'currency'],   { name: 'idx_share_txn_holder_class' });
        await queryInterface.addIndex(table('share_transactions'), ['entity_id', 'share_class_id', 'currency'],                         { name: 'idx_share_txn_class' });
        await queryInterface.addIndex(table('share_transactions'), ['share_set_id'],                                                     { name: 'idx_share_txn_set' });
        await queryInterface.addIndex(table('share_transactions'), ['share_id'],                                                         { name: 'idx_share_txn_header_id' });
        await queryInterface.addIndex(table('share_transactions'), ['company_share_id'],                                                 { name: 'idx_share_txn_company_share' });
        await queryInterface.addIndex(table('share_transactions'), ['entity_id', 'status', 'is_confirm', 'is_deleted'],                  { name: 'idx_share_txn_status' });
        await queryInterface.addIndex(table('share_transactions'), ['entity_id', 'share_cert_no'],                                       { name: 'idx_share_txn_cert' });
        await queryInterface.addIndex(table('share_transactions'), ['entity_id', 'folio_no'],                                            { name: 'idx_share_txn_folio' });
        await queryInterface.addIndex(table('share_transactions'), ['entity_id', 'transferor_entity_id'],                                { name: 'idx_share_txn_transferor' });
        await queryInterface.addIndex(table('share_transactions'), ['entity_id', 'transferee_entity_id'],                                { name: 'idx_share_txn_transferee' });

    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('share_transactions'));
    },

};
