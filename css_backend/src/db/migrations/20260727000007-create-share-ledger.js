'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('share_ledger'), {

            id: {
                type:          Sequelize.BIGINT.UNSIGNED,
                primaryKey:    true,
                autoIncrement: true,
                allowNull:     false,
            },

            entity_id: {
                type:      Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
            },

            share_id: {
                type:         Sequelize.BIGINT.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
            },

            share_transaction_id: {
                type:         Sequelize.BIGINT.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
            },

            company_share_id: {
                type:         Sequelize.INTEGER.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
            },

            share_set_id: {
                type:      Sequelize.STRING(100),
                allowNull: false,
            },

            ledger_scope: {
                type:      Sequelize.ENUM('COMPANY', 'SHAREHOLDER'),
                allowNull: false,
            },

            official_type: {
                type:         Sequelize.ENUM('INDIVIDUAL', 'CORPORATE', 'JOINT', 'SUBFUND', 'TRUST', 'NOMINEE'),
                allowNull:    true,
                defaultValue: null,
            },

            official_entity_id: {
                type:         Sequelize.BIGINT.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
            },

            transaction_type_id: {
                type:      Sequelize.SMALLINT.UNSIGNED,
                allowNull: false,
            },

            transaction_status: {
                type:      Sequelize.ENUM('IN', 'OUT', 'NONE'),
                allowNull: false,
            },

            action_type: {
                type:      Sequelize.ENUM('ADD', 'REMOVE', 'REPLACE', 'ADJUST', 'INFO'),
                allowNull: false,
            },

            transaction_date: {
                type:      Sequelize.DATEONLY,
                allowNull: false,
            },

            transaction_no: {
                type:         Sequelize.STRING(100),
                allowNull:    true,
                defaultValue: null,
            },

            posting_order: {
                type:         Sequelize.INTEGER.UNSIGNED,
                allowNull:    false,
                defaultValue: 1,
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

            old_share_cert_no: {
                type:         Sequelize.STRING(100),
                allowNull:    true,
                defaultValue: null,
            },

            distinctive_from: {
                type:         Sequelize.STRING(100),
                allowNull:    true,
                defaultValue: null,
            },

            distinctive_to: {
                type:         Sequelize.STRING(100),
                allowNull:    true,
                defaultValue: null,
            },

            old_distinctive_from: {
                type:         Sequelize.STRING(100),
                allowNull:    true,
                defaultValue: null,
            },

            old_distinctive_to: {
                type:         Sequelize.STRING(100),
                allowNull:    true,
                defaultValue: null,
            },

            qty_in: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
            },

            qty_out: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
            },

            issued_capital_in: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
            },

            issued_capital_out: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
            },

            paidup_capital_in: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
            },

            paidup_capital_out: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
            },

            unpaid_capital_in: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
            },

            unpaid_capital_out: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
            },

            guarantee_amount_in: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
            },

            guarantee_amount_out: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
            },

            balance_before_qty: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
            },

            balance_after_qty: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
            },

            balance_before_issued_capital: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
            },

            balance_after_issued_capital: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
            },

            balance_before_paidup_capital: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
            },

            balance_after_paidup_capital: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
            },

            balance_before_unpaid_capital: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
            },

            balance_after_unpaid_capital: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    false,
                defaultValue: 0,
            },

            consideration_cash: {
                type:         Sequelize.DECIMAL(28, 6),
                allowNull:    true,
                defaultValue: null,
            },

            consideration_otherwise_cash: {
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

            status: {
                type:         Sequelize.ENUM('DRAFT', 'VALID', 'INVALID', 'CANCELLED'),
                allowNull:    false,
                defaultValue: 'VALID',
            },

            source_from: {
                type:         Sequelize.ENUM('MANUAL', 'DM', 'BIZINSITE', 'WORKFLOW', 'API', 'OPENING'),
                allowNull:    false,
                defaultValue: 'MANUAL',
            },

            workflow_id: {
                type:         Sequelize.INTEGER.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
            },

            workflow_status: {
                type:         Sequelize.STRING(50),
                allowNull:    true,
                defaultValue: null,
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

            is_retain: {
                type:         Sequelize.TINYINT(1),
                allowNull:    false,
                defaultValue: 0,
            },

            is_discrepancy: {
                type:         Sequelize.TINYINT(1),
                allowNull:    false,
                defaultValue: 0,
            },

            remarks: {
                type:         Sequelize.TEXT,
                allowNull:    true,
                defaultValue: null,
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

        // STORED GENERATED delta columns — added via raw SQL
        const t = table('share_ledger');
        await queryInterface.sequelize.query(`
            ALTER TABLE \`${t}\`
            ADD COLUMN \`qty_delta\`              DECIMAL(28,6) GENERATED ALWAYS AS (\`qty_in\`              - \`qty_out\`)              STORED AFTER \`qty_out\`,
            ADD COLUMN \`issued_capital_delta\`   DECIMAL(28,6) GENERATED ALWAYS AS (\`issued_capital_in\`   - \`issued_capital_out\`)   STORED AFTER \`issued_capital_out\`,
            ADD COLUMN \`paidup_capital_delta\`   DECIMAL(28,6) GENERATED ALWAYS AS (\`paidup_capital_in\`   - \`paidup_capital_out\`)   STORED AFTER \`paidup_capital_out\`,
            ADD COLUMN \`unpaid_capital_delta\`   DECIMAL(28,6) GENERATED ALWAYS AS (\`unpaid_capital_in\`   - \`unpaid_capital_out\`)   STORED AFTER \`unpaid_capital_out\`,
            ADD COLUMN \`guarantee_amount_delta\` DECIMAL(28,6) GENERATED ALWAYS AS (\`guarantee_amount_in\` - \`guarantee_amount_out\`) STORED AFTER \`guarantee_amount_out\`
        `);

        await queryInterface.addIndex(t, ['entity_id', 'transaction_date', 'id'],                                                                              { name: 'idx_ledger_entity_period' });
        await queryInterface.addIndex(t, ['entity_id', 'ledger_scope', 'share_class_id', 'currency', 'share_type', 'transaction_date', 'id'],                  { name: 'idx_ledger_company_balance' });
        await queryInterface.addIndex(t, ['entity_id', 'ledger_scope', 'official_entity_id', 'share_class_id', 'currency', 'share_type', 'transaction_date', 'id'], { name: 'idx_ledger_holder_balance' });
        await queryInterface.addIndex(t, ['entity_id', 'official_entity_id', 'transaction_date', 'posting_order', 'id'],                                       { name: 'idx_ledger_holder_register' });
        await queryInterface.addIndex(t, ['entity_id', 'transaction_type_id', 'transaction_date'],                                                             { name: 'idx_ledger_period_type' });
        await queryInterface.addIndex(t, ['share_set_id'],                                                                                                     { name: 'idx_ledger_share_set' });
        await queryInterface.addIndex(t, ['share_transaction_id'],                                                                                             { name: 'idx_ledger_share_id' });
        await queryInterface.addIndex(t, ['share_id'],                                                                                                         { name: 'idx_ledger_header_id' });
        await queryInterface.addIndex(t, ['entity_id', 'share_cert_no'],                                                                                       { name: 'idx_ledger_cert' });
        await queryInterface.addIndex(t, ['entity_id', 'folio_no'],                                                                                            { name: 'idx_ledger_folio' });
        await queryInterface.addIndex(t, ['entity_id', 'status', 'is_deleted'],                                                                                { name: 'idx_ledger_status' });
        await queryInterface.addIndex(t, ['entity_id', 'ledger_scope', 'status', 'is_deleted', 'transaction_date'],                                            { name: 'idx_ledger_report_from_to' });

    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('share_ledger'));
    },

};
