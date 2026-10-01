'use strict';

const table = require('../../helper/dbTable');

// All FK constraints for the share module added after every table exists.
// Self-referential FKs on cs_share_transactions must also run after the table is created.

module.exports = {

    async up(queryInterface) {

        /* ── cs_shares ── */
        await queryInterface.addConstraint(table('shares'), {
            fields:     ['entity_id'],
            type:       'foreign key',
            name:       'fk_shares_entity',
            references: { table: table('entities'), field: 'entity_id' },
        });

        await queryInterface.addConstraint(table('shares'), {
            fields:     ['transaction_type_id'],
            type:       'foreign key',
            name:       'fk_shares_transaction_type',
            references: { table: table('transaction_type'), field: 't_id' },
        });

        /* ── cs_share_transactions ── */
        await queryInterface.addConstraint(table('share_transactions'), {
            fields:     ['company_share_id'],
            type:       'foreign key',
            name:       'fk_share_txn_company_share',
            references: { table: table('entity_shares'), field: 'id' },
        });

        await queryInterface.addConstraint(table('share_transactions'), {
            fields:     ['share_id'],
            type:       'foreign key',
            name:       'fk_share_txn_header',
            references: { table: table('shares'), field: 'share_id' },
            onDelete:   'SET NULL',
        });

        await queryInterface.addConstraint(table('share_transactions'), {
            fields:     ['entity_id'],
            type:       'foreign key',
            name:       'fk_share_txn_entity',
            references: { table: table('entities'), field: 'entity_id' },
        });

        await queryInterface.addConstraint(table('share_transactions'), {
            fields:     ['official_entity_id'],
            type:       'foreign key',
            name:       'fk_share_txn_official_entity',
            references: { table: table('entities'), field: 'entity_id' },
        });

        await queryInterface.addConstraint(table('share_transactions'), {
            fields:     ['share_class_id'],
            type:       'foreign key',
            name:       'fk_share_txn_share_class',
            references: { table: table('share_class_master'), field: 'sc_id' },
        });

        // Self-referential
        await queryInterface.addConstraint(table('share_transactions'), {
            fields:     ['combine_share_id'],
            type:       'foreign key',
            name:       'fk_share_txn_combine_share',
            references: { table: table('share_transactions'), field: 'share_transaction_id' },
            onDelete:   'SET NULL',
        });

        await queryInterface.addConstraint(table('share_transactions'), {
            fields:     ['old_share_id'],
            type:       'foreign key',
            name:       'fk_share_txn_old_share',
            references: { table: table('share_transactions'), field: 'share_transaction_id' },
            onDelete:   'SET NULL',
        });

        await queryInterface.addConstraint(table('share_transactions'), {
            fields:     ['transferee_share_id'],
            type:       'foreign key',
            name:       'fk_share_txn_transferee_share',
            references: { table: table('share_transactions'), field: 'share_transaction_id' },
            onDelete:   'SET NULL',
        });

        await queryInterface.addConstraint(table('share_transactions'), {
            fields:     ['transferor_share_id'],
            type:       'foreign key',
            name:       'fk_share_txn_transferor_share',
            references: { table: table('share_transactions'), field: 'share_transaction_id' },
            onDelete:   'SET NULL',
        });

        await queryInterface.addConstraint(table('share_transactions'), {
            fields:     ['transferee_entity_id'],
            type:       'foreign key',
            name:       'fk_share_txn_transferee_entity',
            references: { table: table('entities'), field: 'entity_id' },
            onDelete:   'SET NULL',
        });

        await queryInterface.addConstraint(table('share_transactions'), {
            fields:     ['transferor_entity_id'],
            type:       'foreign key',
            name:       'fk_share_txn_transferor_entity',
            references: { table: table('entities'), field: 'entity_id' },
            onDelete:   'SET NULL',
        });

        /* ── cs_share_payments ── */
        await queryInterface.addConstraint(table('share_payments'), {
            fields:     ['share_transaction_id'],
            type:       'foreign key',
            name:       'fk_share_payment_share',
            references: { table: table('share_transactions'), field: 'share_transaction_id' },
        });

        await queryInterface.addConstraint(table('share_payments'), {
            fields:     ['entity_id'],
            type:       'foreign key',
            name:       'fk_share_payment_entity',
            references: { table: table('entities'), field: 'entity_id' },
        });

        /* ── cs_share_remarks ── */
        await queryInterface.addConstraint(table('share_remarks'), {
            fields:     ['share_transaction_id'],
            type:       'foreign key',
            name:       'fk_share_remarks_share',
            references: { table: table('share_transactions'), field: 'share_transaction_id' },
            onDelete:   'SET NULL',
        });

        await queryInterface.addConstraint(table('share_remarks'), {
            fields:     ['entity_id'],
            type:       'foreign key',
            name:       'fk_share_remarks_entity',
            references: { table: table('entities'), field: 'entity_id' },
        });

        /* ── cs_share_decimal_settings ── */
        await queryInterface.addConstraint(table('share_decimal_settings'), {
            fields:     ['entity_id'],
            type:       'foreign key',
            name:       'fk_share_decimal_entity',
            references: { table: table('entities'), field: 'entity_id' },
        });

        /* ── cs_share_distinctive ── */
        await queryInterface.addConstraint(table('share_distinctive'), {
            fields:     ['share_transaction_id'],
            type:       'foreign key',
            name:       'fk_distinctive_share',
            references: { table: table('share_transactions'), field: 'share_transaction_id' },
        });

        await queryInterface.addConstraint(table('share_distinctive'), {
            fields:     ['entity_id'],
            type:       'foreign key',
            name:       'fk_distinctive_entity',
            references: { table: table('entities'), field: 'entity_id' },
        });

        /* ── cs_share_ledger ── */
        await queryInterface.addConstraint(table('share_ledger'), {
            fields:     ['share_transaction_id'],
            type:       'foreign key',
            name:       'fk_ledger_share',
            references: { table: table('share_transactions'), field: 'share_transaction_id' },
            onDelete:   'SET NULL',
        });

        await queryInterface.addConstraint(table('share_ledger'), {
            fields:     ['company_share_id'],
            type:       'foreign key',
            name:       'fk_ledger_company_share',
            references: { table: table('entity_shares'), field: 'id' },
            onDelete:   'SET NULL',
        });

        await queryInterface.addConstraint(table('share_ledger'), {
            fields:     ['share_id'],
            type:       'foreign key',
            name:       'fk_ledger_header',
            references: { table: table('shares'), field: 'share_id' },
            onDelete:   'SET NULL',
        });

        await queryInterface.addConstraint(table('share_ledger'), {
            fields:     ['entity_id'],
            type:       'foreign key',
            name:       'fk_ledger_entity',
            references: { table: table('entities'), field: 'entity_id' },
        });

        await queryInterface.addConstraint(table('share_ledger'), {
            fields:     ['official_entity_id'],
            type:       'foreign key',
            name:       'fk_ledger_official_entity',
            references: { table: table('entities'), field: 'entity_id' },
        });

        await queryInterface.addConstraint(table('share_ledger'), {
            fields:     ['share_class_id'],
            type:       'foreign key',
            name:       'fk_ledger_share_class',
            references: { table: table('share_class_master'), field: 'sc_id' },
        });

        await queryInterface.addConstraint(table('share_ledger'), {
            fields:     ['transaction_type_id'],
            type:       'foreign key',
            name:       'fk_ledger_transaction_type',
            references: { table: table('transaction_type'), field: 't_id' },
        });

    },

    async down(queryInterface) {

        // cs_share_ledger
        await queryInterface.removeConstraint(table('share_ledger'), 'fk_ledger_transaction_type');
        await queryInterface.removeConstraint(table('share_ledger'), 'fk_ledger_share_class');
        await queryInterface.removeConstraint(table('share_ledger'), 'fk_ledger_official_entity');
        await queryInterface.removeConstraint(table('share_ledger'), 'fk_ledger_entity');
        await queryInterface.removeConstraint(table('share_ledger'), 'fk_ledger_header');
        await queryInterface.removeConstraint(table('share_ledger'), 'fk_ledger_company_share');
        await queryInterface.removeConstraint(table('share_ledger'), 'fk_ledger_share');

        // cs_share_distinctive
        await queryInterface.removeConstraint(table('share_distinctive'), 'fk_distinctive_entity');
        await queryInterface.removeConstraint(table('share_distinctive'), 'fk_distinctive_share');

        // cs_share_decimal_settings
        await queryInterface.removeConstraint(table('share_decimal_settings'), 'fk_share_decimal_entity');

        // cs_share_remarks
        await queryInterface.removeConstraint(table('share_remarks'), 'fk_share_remarks_entity');
        await queryInterface.removeConstraint(table('share_remarks'), 'fk_share_remarks_share');

        // cs_share_payments
        await queryInterface.removeConstraint(table('share_payments'), 'fk_share_payment_entity');
        await queryInterface.removeConstraint(table('share_payments'), 'fk_share_payment_share');

        // cs_share_transactions
        await queryInterface.removeConstraint(table('share_transactions'), 'fk_share_txn_transferor_entity');
        await queryInterface.removeConstraint(table('share_transactions'), 'fk_share_txn_transferee_entity');
        await queryInterface.removeConstraint(table('share_transactions'), 'fk_share_txn_transferor_share');
        await queryInterface.removeConstraint(table('share_transactions'), 'fk_share_txn_transferee_share');
        await queryInterface.removeConstraint(table('share_transactions'), 'fk_share_txn_old_share');
        await queryInterface.removeConstraint(table('share_transactions'), 'fk_share_txn_combine_share');
        await queryInterface.removeConstraint(table('share_transactions'), 'fk_share_txn_share_class');
        await queryInterface.removeConstraint(table('share_transactions'), 'fk_share_txn_official_entity');
        await queryInterface.removeConstraint(table('share_transactions'), 'fk_share_txn_entity');
        await queryInterface.removeConstraint(table('share_transactions'), 'fk_share_txn_header');
        await queryInterface.removeConstraint(table('share_transactions'), 'fk_share_txn_company_share');

        // cs_shares
        await queryInterface.removeConstraint(table('shares'), 'fk_shares_transaction_type');
        await queryInterface.removeConstraint(table('shares'), 'fk_shares_entity');

    },

};
