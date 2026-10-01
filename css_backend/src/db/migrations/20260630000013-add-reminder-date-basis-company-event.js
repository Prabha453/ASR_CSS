'use strict';

const table = require('../../helper/dbTable');

const TABLE_NAME = table('company_event');
const COLUMN_NAME = 'reminder_date_basis';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const t = await queryInterface.sequelize.transaction();
        try {
            // 1. Add reminder_date_basis column
            await queryInterface.addColumn(
                TABLE_NAME,
                COLUMN_NAME,
                {
                    type: Sequelize.ENUM('ACTUAL_DUE_DATE', 'EXTENDED_DUE_DATE'),
                    allowNull: false,
                    defaultValue: 'EXTENDED_DUE_DATE',
                    comment: 'Reminder calculation basis when extended_due_date exists',
                    after: 'extended_due_date',
                },
                { transaction: t }
            );

            // 2. Widen status ENUM to include EXEMPT and DISPENSE (both currently
            //    missing - exemptCompanyEvent / dispenseCompanyEvent have nowhere
            //    valid to write, and the UI derives its own DISPENSE label off of
            //    WAIVED today only as a display-time workaround)
            await queryInterface.changeColumn(
                TABLE_NAME,
                'status',
                {
                    type: Sequelize.ENUM('PENDING', 'COMPLETED', 'WAIVED', 'CANCELLED', 'EXEMPT', 'DISPENSE'),
                    allowNull: false,
                    defaultValue: 'PENDING',
                },
                { transaction: t }
            );

            await t.commit();
        } catch (err) {
            await t.rollback();
            throw err;
        }
    },

    down: async (queryInterface, Sequelize) => {
        const t = await queryInterface.sequelize.transaction();
        try {
            // Fold new statuses back before shrinking the enum, otherwise the
            // ALTER TABLE will fail / truncate data.
            await queryInterface.sequelize.query(
                `UPDATE \`${TABLE_NAME}\` SET \`status\` = 'WAIVED' WHERE \`status\` = 'DISPENSE'`,
                { transaction: t }
            );
            await queryInterface.sequelize.query(
                `UPDATE \`${TABLE_NAME}\` SET \`status\` = 'PENDING' WHERE \`status\` = 'EXEMPT'`,
                { transaction: t }
            );

            await queryInterface.changeColumn(
                TABLE_NAME,
                'status',
                {
                    type: Sequelize.ENUM('PENDING', 'COMPLETED', 'WAIVED', 'CANCELLED'),
                    allowNull: false,
                    defaultValue: 'PENDING',
                },
                { transaction: t }
            );

            await queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME, { transaction: t });

            await t.commit();
        } catch (err) {
            await t.rollback();
            throw err;
        }
    },
};
