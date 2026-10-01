-- =====================================================================
-- CS Share Register module — final reviewed schema
--
-- Original fixes (v1):
--   1. Table name swap: cs_shares = header, cs_share_transactions = lines
--   2. transaction_type ENUM → transaction_type_id SMALLINT FK
--   3. DEFAULT 0.000…0 simplified to DEFAULT 0
--   4. share_class_id / old_share_class_id: INT → SMALLINT UNSIGNED + FKs
--   5. entity_id / official_entity_id: INT → BIGINT UNSIGNED + FKs
--   6. Self-referential FKs added on cs_share_transactions
--   7. cs_share_ledger.share_status → status
--   8. Duplicate ENGINE line removed
--   9. Index/constraint names corrected
--  10. DECIMAL(36,18) → DECIMAL(18,15) [superseded by fix #15 below]
--  11. cs_share_transactions gained is_workflow / is_discrepancy flags
--  12. cs_shares: share_set_id repositioned after is_deleted
--  13. Primary keys renamed: shares.id→share_id, txn.share_id→share_transaction_id
--      and all dependent FK columns renamed accordingly
--
-- Review-session fixes (v2):
--  14. DECIMAL(18,15) → DECIMAL(28,6) for qty/capital columns (integer part
--      was only 3 digits — max 999 — which overflows any real company).
--      Per-share rate columns use DECIMAL(18,8) (10 integer digits, 8dp).
--  15. cs_shares: removed transaction_no (belongs on the line, not the group)
--      + dropped index idx_shares_no
--  16. cs_share_transactions: removed transaction_date (always same as header;
--      get via share_id → cs_shares) + updated all indexes that included it
--  17. cs_share_transactions: removed transaction_type_id and
--      extra_type_of_transaction (both live on the header only) +
--      dropped fk_share_txn_transaction_type + idx_share_txn_type_date
--  18. cs_share_transactions: shareholder_type → official_type
--  19. cs_share_transactions: added FK constraints for transferee_entity_id
--      and transferor_entity_id → cs_entities
--  20. cs_share_ledger: shareholder_type → official_type (consistency)
--
-- Still open:
--   - cs_entity_shares DDL not included; company_share_id FK target reviewed
--     only via migration file (id = INT UNSIGNED — matches schema) ✓
--   - workflow_id: no FK target yet (no workflow table in codebase)
-- =====================================================================


-- ---------------------------------------------------------------------
-- cs_shares — ONE transaction group / header
-- ---------------------------------------------------------------------
CREATE TABLE `cs_shares` (
  `share_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  `entity_id` BIGINT UNSIGNED NOT NULL,

  `transaction_type_id` SMALLINT UNSIGNED NOT NULL,

  `extra_type_of_transaction` VARCHAR(100) DEFAULT NULL,

  `transaction_date` DATE NOT NULL,

  `status` ENUM('DRAFT','CONFIRMED','VALID','INVALID','CANCELLED') NOT NULL DEFAULT 'DRAFT',

  `source_from` ENUM('MANUAL','DM','BIZINSITE','WORKFLOW','API','OPENING') NOT NULL DEFAULT 'MANUAL',

  `workflow_id` INT UNSIGNED DEFAULT NULL,
  `workflow_status` VARCHAR(50) DEFAULT NULL,

  `is_workflow` TINYINT(1) NOT NULL DEFAULT 0,
  `is_acra` TINYINT(1) NOT NULL DEFAULT 0,
  `is_discrepancy` TINYINT(1) NOT NULL DEFAULT 0,

  `remarks` TEXT DEFAULT NULL,

  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,

  `share_set_id` VARCHAR(100) NOT NULL,

  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  `updated_by` INT UNSIGNED DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`share_id`),

  UNIQUE KEY `uq_shares_set` (`share_set_id`),

  KEY `idx_shares_entity_date` (`entity_id`, `transaction_date`),
  KEY `idx_shares_entity_type_date` (`entity_id`, `transaction_type_id`, `transaction_date`),
  KEY `idx_shares_status` (`entity_id`, `status`, `is_deleted`),
  KEY `idx_shares_workflow` (`workflow_id`, `workflow_status`),

  CONSTRAINT `fk_shares_entity`
    FOREIGN KEY (`entity_id`) REFERENCES `cs_entities` (`entity_id`),

  CONSTRAINT `fk_shares_transaction_type`
    FOREIGN KEY (`transaction_type_id`) REFERENCES `cs_transaction_type` (`t_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ---------------------------------------------------------------------
-- cs_share_transactions — shareholder transaction LINES
-- ---------------------------------------------------------------------
CREATE TABLE `cs_share_transactions` (
  `share_transaction_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  `share_id` BIGINT UNSIGNED DEFAULT NULL,
  `share_set_id` VARCHAR(100) NOT NULL,

  `company_share_id` INT UNSIGNED NOT NULL,
  `entity_id` BIGINT UNSIGNED NOT NULL,

  `official_type` ENUM(
    'INDIVIDUAL',
    'CORPORATE',
    'JOINT',
    'SUBFUND',
    'TRUST',
    'NOMINEE'
  ) NOT NULL,

  `official_entity_id` BIGINT UNSIGNED NOT NULL,

  `currency` VARCHAR(10) NOT NULL,
  `share_class_id` SMALLINT UNSIGNED NOT NULL,

  `share_type` ENUM('NORMAL','BONUS','GUARANTEE') NOT NULL DEFAULT 'NORMAL',

  `transaction_status` ENUM('IN','OUT','NONE') NOT NULL,

  `transaction_no` VARCHAR(100) DEFAULT NULL,

  `folio_no` VARCHAR(100) DEFAULT NULL,

  `share_cert_no` VARCHAR(100) DEFAULT NULL,

  `no_of_shares` DECIMAL(28,6) NOT NULL DEFAULT 0,
  `issued_share_capital` DECIMAL(28,6) NOT NULL DEFAULT 0,
  `paidup_share_capital` DECIMAL(28,6) NOT NULL DEFAULT 0,
  `unpaid_share_capital` DECIMAL(28,6) NOT NULL DEFAULT 0,

  `per_share` DECIMAL(18,8) NOT NULL DEFAULT 0,
  `issued_per_share` DECIMAL(18,8) NOT NULL DEFAULT 0,

  `is_partially_paid` TINYINT(1) NOT NULL DEFAULT 0,
  `partial_payment_no_times` INT UNSIGNED DEFAULT NULL,

  `combine_share_id` BIGINT UNSIGNED DEFAULT NULL,

  `old_share_id` BIGINT UNSIGNED DEFAULT NULL,
  `old_share_class_id` SMALLINT UNSIGNED DEFAULT NULL,
  `old_currency` VARCHAR(10) DEFAULT NULL,
  `old_share_cert_no` VARCHAR(100) DEFAULT NULL,

  `transferee_entity_id` BIGINT UNSIGNED DEFAULT NULL,
  `transferee_share_id` BIGINT UNSIGNED DEFAULT NULL,
  `transferee_no_of_shares` DECIMAL(28,6) DEFAULT NULL,
  `transferee_issued_capital` DECIMAL(28,6) DEFAULT NULL,
  `transferee_paidup_capital` DECIMAL(28,6) DEFAULT NULL,

  `transferor_entity_id` BIGINT UNSIGNED DEFAULT NULL,
  `transferor_share_id` BIGINT UNSIGNED DEFAULT NULL,
  `transferor_no_of_shares` DECIMAL(28,6) DEFAULT NULL,
  `transferor_issued_capital` DECIMAL(28,6) DEFAULT NULL,
  `transferor_paidup_capital` DECIMAL(28,6) DEFAULT NULL,

  `cash` DECIMAL(28,6) DEFAULT NULL,
  `otherwise_cash` DECIMAL(28,6) DEFAULT NULL,
  `no_consideration` TINYINT(1) NOT NULL DEFAULT 0,
  `transactional_consideration` DECIMAL(28,6) DEFAULT NULL,

  `is_amalg_or_merge` TINYINT(1) NOT NULL DEFAULT 0,
  `is_retain` TINYINT(1) NOT NULL DEFAULT 0,
  `is_acra` TINYINT(1) NOT NULL DEFAULT 0,
  `is_vote` TINYINT(1) NOT NULL DEFAULT 0,

  `is_workflow` TINYINT(1) NOT NULL DEFAULT 0,
  `is_discrepancy` TINYINT(1) NOT NULL DEFAULT 0,

  `is_ubo` TINYINT(1) NOT NULL DEFAULT 0,
  `no_of_ubo` INT UNSIGNED DEFAULT NULL,

  `old_data` JSON DEFAULT NULL,

  `data_from` ENUM('MANUAL','DM','BIZINSITE','WORKFLOW','API','OPENING') NOT NULL DEFAULT 'MANUAL',

  `share_workflow_status` VARCHAR(50) DEFAULT NULL,

  `stamp_duty_payment` TINYINT(1) NOT NULL DEFAULT 0,
  `stamp_duty_payment_date` DATE DEFAULT NULL,
  `stamp_duty_payment_amount` DECIMAL(28,6) DEFAULT NULL,

  `status` ENUM('DRAFT','VALID','INVALID','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `is_confirm` TINYINT(1) NOT NULL DEFAULT 0,

  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,

  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  `updated_by` INT UNSIGNED DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`share_transaction_id`),

  KEY `idx_share_txn_entity` (`entity_id`),
  KEY `idx_share_txn_holder` (`entity_id`, `official_entity_id`),
  KEY `idx_share_txn_holder_class` (`entity_id`, `official_entity_id`, `share_class_id`, `currency`),
  KEY `idx_share_txn_class` (`entity_id`, `share_class_id`, `currency`),
  KEY `idx_share_txn_set` (`share_set_id`),
  KEY `idx_share_txn_header_id` (`share_id`),
  KEY `idx_share_txn_company_share` (`company_share_id`),
  KEY `idx_share_txn_status` (`entity_id`, `status`, `is_confirm`, `is_deleted`),
  KEY `idx_share_txn_cert` (`entity_id`, `share_cert_no`),
  KEY `idx_share_txn_folio` (`entity_id`, `folio_no`),
  KEY `idx_share_txn_transferor` (`entity_id`, `transferor_entity_id`),
  KEY `idx_share_txn_transferee` (`entity_id`, `transferee_entity_id`),

  CONSTRAINT `fk_share_txn_company_share`
    FOREIGN KEY (`company_share_id`) REFERENCES `cs_entity_shares` (`id`),

  CONSTRAINT `fk_share_txn_header`
    FOREIGN KEY (`share_id`) REFERENCES `cs_shares` (`share_id`)
    ON DELETE SET NULL,

  CONSTRAINT `fk_share_txn_entity`
    FOREIGN KEY (`entity_id`) REFERENCES `cs_entities` (`entity_id`),

  CONSTRAINT `fk_share_txn_official_entity`
    FOREIGN KEY (`official_entity_id`) REFERENCES `cs_entities` (`entity_id`),

  CONSTRAINT `fk_share_txn_share_class`
    FOREIGN KEY (`share_class_id`) REFERENCES `cs_share_class_master` (`sc_id`),

  CONSTRAINT `fk_share_txn_combine_share`
    FOREIGN KEY (`combine_share_id`) REFERENCES `cs_share_transactions` (`share_transaction_id`)
    ON DELETE SET NULL,

  CONSTRAINT `fk_share_txn_old_share`
    FOREIGN KEY (`old_share_id`) REFERENCES `cs_share_transactions` (`share_transaction_id`)
    ON DELETE SET NULL,

  CONSTRAINT `fk_share_txn_transferee_share`
    FOREIGN KEY (`transferee_share_id`) REFERENCES `cs_share_transactions` (`share_transaction_id`)
    ON DELETE SET NULL,

  CONSTRAINT `fk_share_txn_transferor_share`
    FOREIGN KEY (`transferor_share_id`) REFERENCES `cs_share_transactions` (`share_transaction_id`)
    ON DELETE SET NULL,

  CONSTRAINT `fk_share_txn_transferee_entity`
    FOREIGN KEY (`transferee_entity_id`) REFERENCES `cs_entities` (`entity_id`)
    ON DELETE SET NULL,

  CONSTRAINT `fk_share_txn_transferor_entity`
    FOREIGN KEY (`transferor_entity_id`) REFERENCES `cs_entities` (`entity_id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ---------------------------------------------------------------------
-- cs_share_payments — Consideration / payment details
-- ---------------------------------------------------------------------
CREATE TABLE `cs_share_payments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  `entity_id` BIGINT UNSIGNED NOT NULL,
  `share_transaction_id` BIGINT UNSIGNED NOT NULL,
  `share_set_id` VARCHAR(100) NOT NULL,

  `payment_type` ENUM('CASH','OTHERWISE_THAN_CASH','NO_CONSIDERATION') NOT NULL,

  `cash` DECIMAL(28,6) DEFAULT NULL,
  `otherwise_cash` DECIMAL(28,6) DEFAULT NULL,
  `no_consideration` TINYINT(1) NOT NULL DEFAULT 0,

  `consideration_description` TEXT DEFAULT NULL,
  `payment_date` DATE DEFAULT NULL,

  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,

  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  `updated_by` INT UNSIGNED DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),

  KEY `idx_share_payment_share` (`share_transaction_id`),
  KEY `idx_share_payment_entity_set` (`entity_id`, `share_set_id`),
  KEY `idx_share_payment_type` (`entity_id`, `payment_type`, `payment_date`),

  CONSTRAINT `fk_share_payment_share`
    FOREIGN KEY (`share_transaction_id`) REFERENCES `cs_share_transactions` (`share_transaction_id`),

  CONSTRAINT `fk_share_payment_entity`
    FOREIGN KEY (`entity_id`) REFERENCES `cs_entities` (`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ---------------------------------------------------------------------
-- cs_share_remarks — Remarks for register / report
-- ---------------------------------------------------------------------
CREATE TABLE `cs_share_remarks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  `entity_id` BIGINT UNSIGNED NOT NULL,
  `share_transaction_id` BIGINT UNSIGNED DEFAULT NULL,
  `share_set_id` VARCHAR(100) DEFAULT NULL,

  `transaction_status` ENUM('IN','OUT','NONE') DEFAULT NULL,

  `remarks` TEXT NOT NULL,

  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,

  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  `updated_by` INT UNSIGNED DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),

  KEY `idx_share_remarks_share` (`share_transaction_id`),
  KEY `idx_share_remarks_entity_set` (`entity_id`, `share_set_id`),
  KEY `idx_share_remarks_status` (`entity_id`, `transaction_status`, `is_deleted`),

  CONSTRAINT `fk_share_remarks_share`
    FOREIGN KEY (`share_transaction_id`) REFERENCES `cs_share_transactions` (`share_transaction_id`)
    ON DELETE SET NULL,

  CONSTRAINT `fk_share_remarks_entity`
    FOREIGN KEY (`entity_id`) REFERENCES `cs_entities` (`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ---------------------------------------------------------------------
-- cs_share_decimal_settings — Decimal display / input settings per entity
-- ---------------------------------------------------------------------
CREATE TABLE `cs_share_decimal_settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,

  `entity_id` BIGINT UNSIGNED NOT NULL,

  `no_of_share_decimal` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `issued_capital_decimal` TINYINT UNSIGNED NOT NULL DEFAULT 2,
  `paidup_capital_decimal` TINYINT UNSIGNED NOT NULL DEFAULT 2,
  `rounding_method` ENUM('ROUND','FLOOR','CEIL','MANUAL_ADJUST') NOT NULL DEFAULT 'ROUND',

  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `active_unique_key` TINYINT
    GENERATED ALWAYS AS (
      CASE WHEN `is_deleted` = 0 THEN 1 ELSE NULL END
    ) STORED,

  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  `updated_by` INT UNSIGNED DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),

  UNIQUE KEY `uq_share_decimal_entity` (`entity_id`, `active_unique_key`),

  KEY `idx_share_decimal_entity` (`entity_id`, `is_deleted`),

  CONSTRAINT `fk_share_decimal_entity`
    FOREIGN KEY (`entity_id`) REFERENCES `cs_entities` (`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ---------------------------------------------------------------------
-- cs_share_distinctive — Certificate distinctive number range
-- ---------------------------------------------------------------------
CREATE TABLE `cs_share_distinctive` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  `entity_id` BIGINT UNSIGNED NOT NULL,
  `share_transaction_id` BIGINT UNSIGNED NOT NULL,
  `share_set_id` VARCHAR(100) NOT NULL,

  `share_cert_no` VARCHAR(100) DEFAULT NULL,

  `distinctive_from` VARCHAR(100) DEFAULT NULL,
  `distinctive_to` VARCHAR(100) DEFAULT NULL,

  `no_of_shares` DECIMAL(28,6) NOT NULL DEFAULT 0,

  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,

  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  `updated_by` INT UNSIGNED DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),

  KEY `idx_distinctive_share` (`share_transaction_id`),
  KEY `idx_distinctive_entity_set` (`entity_id`, `share_set_id`),
  KEY `idx_distinctive_cert` (`entity_id`, `share_cert_no`),
  KEY `idx_distinctive_range` (`entity_id`, `distinctive_from`, `distinctive_to`),

  CONSTRAINT `fk_distinctive_share`
    FOREIGN KEY (`share_transaction_id`) REFERENCES `cs_share_transactions` (`share_transaction_id`),

  CONSTRAINT `fk_distinctive_entity`
    FOREIGN KEY (`entity_id`) REFERENCES `cs_entities` (`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ===========================================================================
-- Register / Report
-- ALL reporting reads from cs_share_ledger — never directly from cs_shares
-- or cs_share_transactions.
-- ===========================================================================

-- ---------------------------------------------------------------------
-- cs_share_ledger — Computed ledger for reports and register
-- ---------------------------------------------------------------------
CREATE TABLE `cs_share_ledger` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  `entity_id` BIGINT UNSIGNED NOT NULL,

  `share_id` BIGINT UNSIGNED DEFAULT NULL,
  `share_transaction_id` BIGINT UNSIGNED DEFAULT NULL,
  `company_share_id` INT UNSIGNED DEFAULT NULL,

  `share_set_id` VARCHAR(100) NOT NULL,

  `ledger_scope` ENUM('COMPANY','SHAREHOLDER') NOT NULL,

  `official_type` ENUM(
    'INDIVIDUAL',
    'CORPORATE',
    'JOINT',
    'SUBFUND',
    'TRUST',
    'NOMINEE'
  ) DEFAULT NULL,

  `official_entity_id` BIGINT UNSIGNED DEFAULT NULL,

  `transaction_type_id` SMALLINT UNSIGNED NOT NULL,

  `transaction_status` ENUM('IN','OUT','NONE') NOT NULL,

  `action_type` ENUM('ADD','REMOVE','REPLACE','ADJUST','INFO') NOT NULL,

  `transaction_date` DATE NOT NULL,
  `transaction_no` VARCHAR(100) DEFAULT NULL,

  `posting_order` INT UNSIGNED NOT NULL DEFAULT 1,

  `currency` VARCHAR(10) NOT NULL,
  `share_class_id` SMALLINT UNSIGNED NOT NULL,

  `share_type` ENUM('NORMAL','BONUS','GUARANTEE') NOT NULL DEFAULT 'NORMAL',

  `folio_no` VARCHAR(100) DEFAULT NULL,

  `share_cert_no` VARCHAR(100) DEFAULT NULL,
  `old_share_cert_no` VARCHAR(100) DEFAULT NULL,

  `distinctive_from` VARCHAR(100) DEFAULT NULL,
  `distinctive_to` VARCHAR(100) DEFAULT NULL,

  `old_distinctive_from` VARCHAR(100) DEFAULT NULL,
  `old_distinctive_to` VARCHAR(100) DEFAULT NULL,

  `qty_in` DECIMAL(28,6) NOT NULL DEFAULT 0,
  `qty_out` DECIMAL(28,6) NOT NULL DEFAULT 0,
  `qty_delta` DECIMAL(28,6) GENERATED ALWAYS AS (`qty_in` - `qty_out`) STORED,

  `issued_capital_in` DECIMAL(28,6) NOT NULL DEFAULT 0,
  `issued_capital_out` DECIMAL(28,6) NOT NULL DEFAULT 0,
  `issued_capital_delta` DECIMAL(28,6) GENERATED ALWAYS AS (`issued_capital_in` - `issued_capital_out`) STORED,

  `paidup_capital_in` DECIMAL(28,6) NOT NULL DEFAULT 0,
  `paidup_capital_out` DECIMAL(28,6) NOT NULL DEFAULT 0,
  `paidup_capital_delta` DECIMAL(28,6) GENERATED ALWAYS AS (`paidup_capital_in` - `paidup_capital_out`) STORED,

  `unpaid_capital_in` DECIMAL(28,6) NOT NULL DEFAULT 0,
  `unpaid_capital_out` DECIMAL(28,6) NOT NULL DEFAULT 0,
  `unpaid_capital_delta` DECIMAL(28,6) GENERATED ALWAYS AS (`unpaid_capital_in` - `unpaid_capital_out`) STORED,

  `guarantee_amount_in` DECIMAL(28,6) NOT NULL DEFAULT 0,
  `guarantee_amount_out` DECIMAL(28,6) NOT NULL DEFAULT 0,
  `guarantee_amount_delta` DECIMAL(28,6) GENERATED ALWAYS AS (`guarantee_amount_in` - `guarantee_amount_out`) STORED,

  `balance_before_qty` DECIMAL(28,6) NOT NULL DEFAULT 0,
  `balance_after_qty` DECIMAL(28,6) NOT NULL DEFAULT 0,

  `balance_before_issued_capital` DECIMAL(28,6) NOT NULL DEFAULT 0,
  `balance_after_issued_capital` DECIMAL(28,6) NOT NULL DEFAULT 0,

  `balance_before_paidup_capital` DECIMAL(28,6) NOT NULL DEFAULT 0,
  `balance_after_paidup_capital` DECIMAL(28,6) NOT NULL DEFAULT 0,

  `balance_before_unpaid_capital` DECIMAL(28,6) NOT NULL DEFAULT 0,
  `balance_after_unpaid_capital` DECIMAL(28,6) NOT NULL DEFAULT 0,

  `consideration_cash` DECIMAL(28,6) DEFAULT NULL,
  `consideration_otherwise_cash` DECIMAL(28,6) DEFAULT NULL,
  `no_consideration` TINYINT(1) NOT NULL DEFAULT 0,
  `transactional_consideration` DECIMAL(28,6) DEFAULT NULL,

  `status` ENUM('DRAFT','VALID','INVALID','CANCELLED') NOT NULL DEFAULT 'VALID',

  `source_from` ENUM('MANUAL','DM','BIZINSITE','WORKFLOW','API','OPENING') NOT NULL DEFAULT 'MANUAL',

  `workflow_id` INT UNSIGNED DEFAULT NULL,
  `workflow_status` VARCHAR(50) DEFAULT NULL,

  `is_acra` TINYINT(1) NOT NULL DEFAULT 0,
  `is_vote` TINYINT(1) NOT NULL DEFAULT 0,
  `is_retain` TINYINT(1) NOT NULL DEFAULT 0,
  `is_discrepancy` TINYINT(1) NOT NULL DEFAULT 0,

  `remarks` TEXT DEFAULT NULL,

  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,

  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  `updated_by` INT UNSIGNED DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),

  KEY `idx_ledger_entity_period` (`entity_id`, `transaction_date`, `id`),

  KEY `idx_ledger_company_balance` (
    `entity_id`, `ledger_scope`, `share_class_id`, `currency`,
    `share_type`, `transaction_date`, `id`
  ),

  KEY `idx_ledger_holder_balance` (
    `entity_id`, `ledger_scope`, `official_entity_id`,
    `share_class_id`, `currency`, `share_type`, `transaction_date`, `id`
  ),

  KEY `idx_ledger_holder_register` (
    `entity_id`, `official_entity_id`, `transaction_date`, `posting_order`, `id`
  ),

  KEY `idx_ledger_period_type` (`entity_id`, `transaction_type_id`, `transaction_date`),

  KEY `idx_ledger_share_set` (`share_set_id`),
  KEY `idx_ledger_share_id` (`share_transaction_id`),
  KEY `idx_ledger_header_id` (`share_id`),
  KEY `idx_ledger_cert` (`entity_id`, `share_cert_no`),
  KEY `idx_ledger_folio` (`entity_id`, `folio_no`),
  KEY `idx_ledger_status` (`entity_id`, `status`, `is_deleted`),

  KEY `idx_ledger_report_from_to` (
    `entity_id`, `ledger_scope`, `status`, `is_deleted`, `transaction_date`
  ),

  CONSTRAINT `fk_ledger_share`
    FOREIGN KEY (`share_transaction_id`) REFERENCES `cs_share_transactions` (`share_transaction_id`)
    ON DELETE SET NULL,

  CONSTRAINT `fk_ledger_company_share`
    FOREIGN KEY (`company_share_id`) REFERENCES `cs_entity_shares` (`id`)
    ON DELETE SET NULL,

  CONSTRAINT `fk_ledger_header`
    FOREIGN KEY (`share_id`) REFERENCES `cs_shares` (`share_id`)
    ON DELETE SET NULL,

  CONSTRAINT `fk_ledger_entity`
    FOREIGN KEY (`entity_id`) REFERENCES `cs_entities` (`entity_id`),

  CONSTRAINT `fk_ledger_official_entity`
    FOREIGN KEY (`official_entity_id`) REFERENCES `cs_entities` (`entity_id`),

  CONSTRAINT `fk_ledger_share_class`
    FOREIGN KEY (`share_class_id`) REFERENCES `cs_share_class_master` (`sc_id`),

  CONSTRAINT `fk_ledger_transaction_type`
    FOREIGN KEY (`transaction_type_id`) REFERENCES `cs_transaction_type` (`t_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
